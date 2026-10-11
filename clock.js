/**
 * Clock: a round wall clock seen face on, a rim, twelve ticks (the quarters longer), an hour hand, a minute hand and
 * the pin they turn on. At rest it shows the time it is now. Bring the pointer near and you are setting it: the minute
 * hand chases the pointer round the dial and the hour hand follows a twelfth as fast, so a full turn of the pointer is
 * an hour; leave and the hands wind back, the short way, to the time it really is. The face takes the bright edge
 * when the pointer is on it. The read-out says the time the hands show; the slider is how quick the hands are.
 *
 * Rim and hands are thin plates, their face turned away, their sides and their face toward you, painted back to front;
 * the ticks are open lines on the face. The pointer is read as an angle round the pin, and the hit test is the dial.
 */
const { clamp, mk, open, poly, register, spring, stepS, reducedMotion, disposer, pointer } = HL;

const K = 112, CX = 200, CY = 160, RIM = 1, TAU = 2 * Math.PI;
const S = (u, v, d) => [CX + u * K - d * 0.7, CY - v * K + d * 0.7];
const disc = (r, n = 64) => Array.from({ length: n }, (_, k) => [r * Math.cos((k / n) * TAU), r * Math.sin((k / n) * TAU)]);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function mount({ stage, svg, read }, value) {
  const bag = disposer(), g = mk("g", {}, svg);
  /** A thin plate: the face turned away, its sides, the face toward you. */
  const plate = () => ({ away: mk("path", { class: "sil" }, g), side: mk("path", { class: "fo" }, g), toward: mk("path", { class: "sil" }, g) });
  function put(p, pts, d0, t) {
    const f = pts.map(([u, v]) => S(u, v, d0 + t)), b = pts.map(([u, v]) => S(u, v, d0));
    p.away.setAttribute("d", poly(b));
    p.side.setAttribute("d", f.map((q, i) => poly([q, f[(i + 1) % f.length], b[(i + 1) % f.length], b[i]])).join(""));
    p.toward.setAttribute("d", poly(f));
  }
  const rim = plate();
  put(rim, disc(RIM), 0, 9);
  const face = mk("path", { class: "nf" }, g), ticks = mk("path", { class: "nf" }, g);
  face.setAttribute("d", poly(disc(RIM - 0.08).map(([u, v]) => S(u, v, 9))));
  ticks.setAttribute("d", Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * TAU, r0 = k % 3 ? 0.8 : 0.7, r1 = 0.86;
    return open([S(r0 * Math.sin(a), r0 * Math.cos(a), 9), S(r1 * Math.sin(a), r1 * Math.cos(a), 9)]);
  }).join(""));
  const hour = plate(), minute = plate(), pin = plate();
  put(pin, disc(0.05, 24), 9, 4.6);

  /** A hand at angle a, clockwise from twelve: tapered from its tail past the pin out to its tip. */
  const hand = (a, len, w) => {
    const d = [Math.sin(a), Math.cos(a)], n = [d[1], -d[0]], at = (s, o) => [d[0] * s + n[0] * o, d[1] * s + n[1] * o];
    return [at(-0.12, w * 0.6), at(len, w * 0.25), at(len + 0.04, 0), at(len, -w * 0.25), at(-0.12, -w * 0.6)];
  };
  // the minute hand's angle, counted on past one turn so the hour hand can follow: m / 12 is the hour hand's angle
  const now = () => { const t = new Date(); return ((t.getHours() % 12) * 60 + t.getMinutes()) / 60 * TAU; };
  const m = spring(now(), { k: value, c: 2 * Math.sqrt(value), eps: 0.002 });
  const shown = () => { const total = Math.round((m.x / TAU) * 60), h = Math.floor(total / 60) % 12, mm = ((total % 60) + 60) % 60; return `${((h + 12) % 12) || 12}:${String(mm).padStart(2, "0")}`; };
  let on = false;
  function draw() {
    put(hour, hand(m.x / 12, 0.48, 0.07), 9, 1.4);
    put(minute, hand(m.x, 0.74, 0.05), 10.4, 1.4);
    read.textContent = on ? "setting · " + shown() : "rest";
  }
  draw();

  const B = register(stage, (dt) => { const moving = stepS(m, dt); draw(); return moving; });
  bag.add(B.unregister);

  let lit = false;
  function point(q) {
    on = !!q;
    if (q) {
      const c = S(0, 0, 9), a = Math.atan2(q[0] - c[0], c[1] - q[1]);
      m.t = m.t + wrap(a - m.t);
    } else {
      const m0 = now(), half = 6 * TAU;
      m.t = m0 + 2 * half * Math.round((m.x - m0) / (2 * half));
    }
    if (reducedMotion()) m.x = m.t;
    const c = S(0, 0, 9), inside = !!q && Math.hypot(q[0] - c[0], q[1] - c[1]) < RIM * K;
    if (inside !== lit) { lit = inside; rim.toward.classList.toggle("hi", lit); }
    draw(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { m.k = v; m.c = 2 * Math.sqrt(v); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "clock",
  means: "A wall clock: bring the pointer near and you set it, the minute hand chasing the pointer round; leave and it winds back to now.",
  rules: [1, 7, 8, 10],
  range: [30, 80, 200],
  mount,
});
