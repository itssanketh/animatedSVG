/**
 * Oak: a tree on a mound of grass, face on: its trunk with two branches and a crown of round clumps of leaves. The pointer is the
 * wind. Bring it near and the wind blows from its side: the tree bends away from it, the trunk curving and the crown leaning, the
 * clumps swaying each a little out of step, and leaves are torn off and blown away downwind, tumbling; the nearer the pointer, the
 * stronger the wind. Leave and the wind drops and the tree swings back upright and settles. The crown takes the bright edge in a
 * strong wind. The read-out gives the wind's strength and side. The slider is the strongest wind, in metres a second.
 *
 * The trunk is a tube round a bending middle line; the clumps are plates, their back face, the strips round their edge and their
 * front face, painted back to front; the loose leaves are small plates. The pointer is read against the tree's resting middle.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const ell = (cx, cy, rx, ry, n = 32) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
const BASE = [200, 262], TOPY = 150;
// the clumps of the crown: where they sit, how big, how deep, back to front
const CLUMPS = [[160, 116, 30, 0], [240, 112, 30, 0], [200, 88, 34, 2], [170, 140, 26, 4], [232, 142, 28, 4], [200, 124, 32, 6], [146, 128, 20, 8], [256, 130, 20, 8]].map(([x, y, r, d], i) => ({ x, y, r, d, i, loop: Array.from({ length: 36 }, (_, k) => { const a = (k / 36) * 2 * Math.PI, rr = r * (1 + 0.035 * Math.sin(a * 9 + i * 2)); return [rr * Math.cos(a), rr * 0.92 * Math.sin(a)]; }) }));
const leaf = (a, s) => [[0, -s], [s * 0.6, 0], [0, s], [-s * 0.6, 0]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let top = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  // the mound and its grass
  el("sil").setAttribute("d", poly([...Array.from({ length: 25 }, (_, i) => { const t = i / 24; return [90 + t * 220, 262 - 14 * Math.sin(Math.PI * t)]; }), [310, 270], [90, 270]].map((p) => S(p, 6))));
  el("nf lo").setAttribute("d", [110, 140, 175, 230, 262, 290].map((x, k) => open([[x, 262 - 13 * Math.sin((Math.PI * (x - 90)) / 220)], [x + 3 + (k % 2) * 2, 252 - 13 * Math.sin((Math.PI * (x - 90)) / 220)]].map((p) => S(p, 6)))).join(""));
  const trunk = { b: el("sil"), s: el("fo"), f: el("sil") }, bark = el("nf lo");
  const clumps = CLUMPS.map((c) => ({ ...c, b: el("sil"), s: el("fo"), f: el("sil"), sw: spring(0, { k: 22 + c.i * 3, c: 3.5 }) }));
  const leavesEl = el("sil");
  const wind = spring(0, { k: 12, c: 4 });
  let clock = 0, on = false, side = 1, want = 0, flying = [];
  const drawPlate = (e, loop, d0, d1) => { e.b.setAttribute("d", poly(loop.map((q) => S(q, d0)))); e.s.setAttribute("d", loop.map((q, i) => { const r = loop[(i + 1) % loop.length]; return poly([S(q, d0), S(r, d0), S(r, d1), S(q, d1)]); }).join("")); e.f.setAttribute("d", poly(loop.map((q) => S(q, d1)))); };

  function draw() {
    const w = wind.x, bend = (y) => { const t = (BASE[1] - y) / (BASE[1] - 60); return w * 30 * t * t; };
    // the trunk: a tube bending downwind, narrowing as it rises, with its two branches
    const mid = Array.from({ length: 9 }, (_, i) => { const y = BASE[1] - (i / 8) * (BASE[1] - TOPY); return [BASE[0] + bend(y), y]; }), wd = (i) => 22 - i * 1.6;
    const side_ = (sg) => mid.map((p, i) => [p[0] + sg * wd(i) / 2, p[1]]);
    const tr = [...side_(-1), ...side_(1).reverse()];
    drawPlate(trunk, tr, 8, 13);
    const br = (y0, dx, dy) => { const p = [BASE[0] + bend(y0), y0], q = [p[0] + dx + bend(y0 + dy) * 0.3, y0 + dy]; return open([p, q].map((r) => S(r, 13))); };
    bark.setAttribute("d", br(196, -26, -30) + br(186, 28, -34) + open([[BASE[0] + bend(240) - 3, 240], [BASE[0] + bend(220) - 2, 220]].map((r) => S(r, 13))));
    clumps.forEach((c) => {
      const dx = bend(c.y) + c.sw.x * 6 * (1 + c.i * 0.08), loop = c.loop.map(([x, y]) => [c.x + x + dx, c.y + y]);
      drawPlate(c, loop, 4 + c.d, 9 + c.d);
    });
    leavesEl.setAttribute("d", flying.map((l) => poly(leaf(l.a, 3.2).map(([x, y]) => S([l.x + x, l.y + y], 18)))).join(""));
  }
  draw();

  const B = register(stage, (dt) => {
    let m = stepS(wind, dt);
    clock += dt;
    // the clumps sway, each to its own beat, as hard as the wind blows
    for (const c of clumps) { c.sw.t = Math.abs(wind.x) > 0.02 ? Math.sin(clock * (2.4 + c.i * 0.37)) * wind.x * 1.4 : 0; if (stepS(c.sw, dt)) m = true; }
    // leaves torn off and blown downwind
    if (on && Math.random() < dt * 9 * Math.abs(wind.x)) { const c = CLUMPS[Math.floor(Math.random() * CLUMPS.length)]; flying.push({ x: c.x + bend0(c.y), y: c.y + (Math.random() - 0.5) * c.r, vx: side * (40 + 60 * Math.abs(wind.x)), vy: -10 + Math.random() * 30, a: Math.random() * 6, va: (Math.random() - 0.5) * 8 }); }
    flying.forEach((l) => { l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 18 * dt; l.a += l.va * dt; });
    flying = flying.filter((l) => l.x > 10 && l.x < 390 && l.y < 300);
    draw();
    clumps[5].f.classList.toggle("hi", Math.abs(wind.x) > 0.6);
    read.textContent = Math.abs(wind.x) > 0.03 ? `wind ${(Math.abs(wind.x) * top).toFixed(0)} m/s ${wind.x > 0 ? "→" : "←"}` : "rest";
    return m || on || flying.length > 0 || clumps.some((c) => Math.abs(c.sw.x) > 0.001);
  });
  const bend0 = (y) => { const t = (BASE[1] - y) / (BASE[1] - 60); return wind.x * 30 * t * t; };
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (q) {
      // the wind blows away from the pointer's side, stronger the nearer it is
      const dx = 200 - q[0]; side = dx >= 0 ? 1 : -1;
      want = side * Math.max(0.25, Math.min(1, 1 - (Math.abs(dx) - 30) / 200));
      wind.t = want;
    } else wind.t = 0;
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { top = v; }, destroy: bag.dispose };
}

hairline({
  name: "oak",
  means: "A tree: the pointer is the wind, and the tree bends away from it, its crown swaying and leaves blowing off; leave and it settles.",
  rules: [1, 3, 7, 8],
  range: [10, 18, 26],
  mount,
});
