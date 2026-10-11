/**
 * Cache: how a CPU gets its data, built as a staircase. RAM is the floor, a long tray of eight numbered blocks, each
 * number in dots on its top; L2 is a step up, with four places; L1 a step higher, with two; and at the top stands the
 * CPU, a chip with pins round its edge. Point at a RAM block to ask for its value: a copy climbs to the chip from the
 * nearest step that holds it, hopping up each step on the way, and every cache it lands in keeps a copy, pushing out
 * the one used longest ago. A miss climbs the whole staircase slowly; an L2 hit is quicker; an L1 hit only takes the
 * last step. Sweep the pointer across RAM and back and the caches warm up. The copy on its way takes the bright edge.
 * The read-out says where the value came from and roughly what it cost; the slider is the time of a full climb, in ms.
 *
 * Steps, chip and blocks are rounded boxes, a silhouette and one crease, painted back to front. The hit test reads the
 * pointer against each RAM block's resting place.
 */
const { Cam, clamp, facing, fit, flatDot, lerp, mk, place, prism, proj, rings, seg, reducedMotion, disposer, pointer, put, register, solid } = HL;

const B = 6.2, BH = 4, ARC = 8;
// the steps: their tops, and the places on them
const Z = { RAM: 0, L2: 9, L1: 18, CPU: 27 };
const SLOTS = { L1: [[20, -4.5], [20, 4.5]], L2: [[37, -4.5], [37, 4.5], [45, -4.5], [45, 4.5]], RAM: Array.from({ length: 8 }, (_, i) => [58 + (i % 4) * 8.5, i < 4 ? -4.5 : 4.5]) };
const COST = { L1: "1 ns", L2: "4 ns", RAM: "100 ns" };
const EASE = (u) => u * u * (3 - 2 * u);
// a value's dots: up to eight, on a three by three grid
const DOT = (k) => [((k % 3) - 1) * 1.7, (Math.floor(k / 3) - 1) * 1.7];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let trip = value;
  const C = Cam(45, 0.5, 3.4);
  fit(C, [[-8, -11, 0], [92, 11, 0], [92, -11, 0], [-8, 11, 0], [0, 0, Z.CPU + 4], [20, 0, Z.L1 + BH + ARC]], 200, 170);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const box = (x0, y0, x1, y1, r = 2.4) => rings(x0, y0, x1, y1, r, 1);
  const step = (x0, x1, top) => { const [r, n] = box(x0, -10, x1, 10); put(solid(g), prism(P, front, r, n, 0, top)); };
  // back to front: the chip's step and the chip, then L1's step, L2's, and RAM's floor tray
  step(-8, 8, Z.CPU);
  const [cr, cn] = box(-5.5, -5.5, 5.5, 5.5, 1.6); put(solid(g), prism(P, front, cr, cn, Z.CPU, Z.CPU + 2));
  const [dr, dn] = box(-2.6, -2.6, 2.6, 2.6, 0.8); put(solid(g), prism(P, front, dr, dn, Z.CPU + 2, Z.CPU + 2.8));
  // the chip's pins: four a side, out from its edges
  mk("path", { class: "nf", d: [-3.3, -1.1, 1.1, 3.3].flatMap((d) => [seg(P(d, -5.5, Z.CPU + 1), P(d, -7.5, Z.CPU + 1)), seg(P(d, 5.5, Z.CPU + 1), P(d, 7.5, Z.CPU + 1)), seg(P(-5.5, d, Z.CPU + 1), P(-7.5, d, Z.CPU + 1)), seg(P(5.5, d, Z.CPU + 1), P(7.5, d, Z.CPU + 1))]).join("") }, g);
  /** A block that shows a value: its box, and dots enough for any value, shown as needed. */
  const block = () => { const el = solid(g); return { el, dots: Array.from({ length: 8 }, () => flatDot(el.g, C, 0.55, "dot m")) }; };
  function show(b, v, x, y, z) {
    b.el.g.setAttribute("display", v ? "inline" : "none");
    if (!v) return;
    const [r, n] = box(x - B / 2, y - B / 2, x + B / 2, y + B / 2, 1.6); put(b.el, prism(P, front, r, n, z, z + BH));
    b.dots.forEach((d, k) => { d.setAttribute("display", k < v ? "inline" : "none"); const [u, w] = DOT(k); place(d, P(x + u, y + w, z + BH)); });
  }
  step(15, 25, Z.L1); const l1 = SLOTS.L1.map(block);
  step(32, 50, Z.L2); const l2 = SLOTS.L2.map(block);
  step(53, 91, 1.2); const ram = SLOTS.RAM.map(block);
  const mover = block();
  SLOTS.RAM.forEach(([x, y], i) => show(ram[i], i + 1, x, y, 1.2));

  // what each cache holds (oldest use first), and which value sits in each of its places
  const held = { L1: [2, 5], L2: [2, 5, 7, 1] }, slotOf = { L1: [2, 5], L2: [2, 5, 7, 1] };
  /** Puts v in a cache: refreshed if it is there, else in the place of the one used longest ago. Returns the place. */
  function keep(level, v) {
    const h = held[level];
    if (h.includes(v)) { h.splice(h.indexOf(v), 1); h.push(v); return slotOf[level].indexOf(v); }
    const old = h.shift(), i = slotOf[level].indexOf(old); slotOf[level][i] = v; h.push(v); return i;
  }
  const at = (level, i) => [...SLOTS[level][i], level === "RAM" ? 1.2 + BH : Z[level] + BH];

  // the climb under way: its legs, where the value came from, and what the caches held before it set out
  let legs = null, from = "", before = null, t0 = 0, carried = 0, lit = false;
  function request(v) {
    from = held.L1.includes(v) ? "L1" : held.L2.includes(v) ? "L2" : "RAM";
    before = { L1: slotOf.L1.slice(), L2: slotOf.L2.slice() };
    legs = [];
    let here = from === "RAM" ? at("RAM", v - 1) : at(from, slotOf[from].indexOf(v));
    // a miss climbs into L2 first; anything not yet in L1 climbs into it; then the last step up to the chip
    if (from === "RAM") { const b = at("L2", keep("L2", v)); legs.push({ a: here, b, ms: trip * 0.55 }); here = b; } else keep("L2", v);
    if (from !== "L1") { const b = at("L1", keep("L1", v)); legs.push({ a: here, b, ms: trip * 0.28 }); here = b; } else keep("L1", v);
    legs.push({ a: here, b: [0, 0, Z.CPU + 3], ms: trip * 0.17 });
    t0 = performance.now(); carried = v;
    read.textContent = `fetch ${v} · ${from === "RAM" ? "miss, from RAM" : `${from} hit`}`;
  }
  function frame(now) {
    let k = 0, e = 0;
    if (legs) { e = Math.max(0, now - t0); while (k < legs.length && e > legs[k].ms) { e -= legs[k].ms; k++; } }
    // a cache shows its new contents once the copy has landed in it
    const l2now = !legs || (from === "RAM" && k >= 1), l1now = !legs || (from === "RAM" && k >= 2) || (from === "L2" && k >= 1) || from === "L1";
    (l1now ? slotOf.L1 : before.L1).forEach((v, i) => show(l1[i], v, ...SLOTS.L1[i], Z.L1));
    (l2now ? slotOf.L2 : before.L2).forEach((v, i) => show(l2[i], v, ...SLOTS.L2[i], Z.L2));
    if (!legs) { show(mover, 0); return false; }
    if (k >= legs.length) {
      show(mover, 0); legs = null;
      if (lit) { mover.el.sil.classList.remove("hi"); lit = false; }
      read.textContent = `${carried} · ${from === "RAM" ? "miss" : `${from} hit`} · ${COST[from]}`;
      return frame(now);
    }
    // each leg a hop up a step: rising over the step's edge, then down onto the place
    const { a, b, ms } = legs[k], u = EASE(clamp(e / ms, 0, 1));
    show(mover, carried, lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u) - BH + ARC * Math.sin(Math.PI * u));
    g.append(mover.el.g);
    if (!lit) { mover.el.sil.classList.add("hi"); lit = true; }
    return true;
  }
  const Bk = register(stage, (_dt, now) => frame(now));
  bag.add(Bk.unregister);
  frame(performance.now());

  // the hit test: the RAM block nearest the pointer, near enough
  const rest = SLOTS.RAM.map(([x, y]) => P(x, y, 1.2 + BH));
  let asked = 0;
  function point(q) {
    let v = 0;
    if (q) { const i = rest.reduce((m, p, j) => (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(rest[m][0] - q[0], rest[m][1] - q[1]) ? j : m), 0); if (Math.hypot(rest[i][0] - q[0], rest[i][1] - q[1]) < 18) v = i + 1; }
    if (v && v !== asked && !legs) { asked = v; request(v); if (reducedMotion()) t0 -= trip * 2; }
    if (!v) { asked = 0; if (!legs) read.textContent = "rest"; }
    Bk.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { trip = clamp(v, 400, 6000); }, destroy: bag.dispose };
}

hairline({
  name: "cache",
  means: "A CPU cache as a staircase: point at a value in RAM and a copy climbs to the chip through L2 and L1; ask again and it hits.",
  rules: [1, 2, 7, 10],
  range: [3600, 2500, 1700],
  mount,
});
