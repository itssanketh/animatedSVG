/**
 * Binary: a byte, eight bit keys in a row in a tray, the highest place on the left. A key that is 1 stands up out of the tray with
 * a dot lit on its top; a key that is 0 sits down flush. At rest the byte holds 42, 0010 1010. Each time the pointer comes onto a
 * key, that bit flips: the key hops and lands the other way, up or down, and the byte's value changes by its place, 128 at the
 * left down to 1 at the right. The key just flipped takes the bright edge, and the read-out gives the byte in binary and in
 * decimal. Leave and the keys go back to 42. The slider is how high a key hops as it flips.
 *
 * Each key is a rounded box, a silhouette and one crease, on its own spring; the tray is drawn first. The key under the pointer
 * is the one whose resting middle is nearest the pointer along the row, which never moves.
 */
const { Cam, facing, fit, mk, prism, proj, rings, spring, stepS, flatDot, place, disposer, pointer, put, register, solid } = HL;

const N = 8, PITCH = 12, W = 10, UP = 8, LOW = 1.2, REST = 42;
const bitsOf = (v) => Array.from({ length: N }, (_, i) => (v >> (N - 1 - i)) & 1);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let hop = value;
  const END = (N - 1) * PITCH;
  const C = Cam(45, 0.5, 3.2);
  fit(C, [[-9, -9, -3], [END + 9, 9, -3], [END + 9, -9, -3], [-9, 9, -3], [0, 0, UP + 16], [END, 0, UP + 16]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [tr, ti] = rings(-9, -9, END + 9, 9, 5, 1.6);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  const [ring, inner] = rings(-W / 2, -W / 2, W / 2, W / 2, 2.2, 0.9), at = (r, x) => r.map((q) => ({ ...q, u: q.u + x }));
  let bits = bitsOf(REST);
  const keys = bits.map((b, i) => {
    const s = solid(g), dot = flatDot(g, C, 1.3, "dot");
    return { i, x: i * PITCH, s, dot, h: spring(b ? UP : LOW, { k: 120, c: 13 }), arc: spring(0, { k: 90, c: 10 }) };
  });
  const value_ = () => bits.reduce((v, b) => v * 2 + b, 0);
  const show = () => { const v = value_(), s = bits.join(""); read.textContent = v === REST && !lit ? "rest" : `${s.slice(0, 4)} ${s.slice(4)} = ${v}`; };

  function draw() {
    for (const k of keys) {
      const top = k.h.x + Math.max(0, k.arc.x);
      put(k.s, prism(P, front, at(ring, k.x), at(inner, k.x), 0, top));
      // the lit dot rides on a key that is 1, and hides inside it when 0
      place(k.dot, P(k.x, 0, top));
      k.dot.setAttribute("class", bits[k.i] ? "dot" : "dot off");
    }
  }
  draw();

  const B = register(stage, (dt) => {
    let m = false;
    for (const k of keys) { if (stepS(k.h, dt)) m = true; if (stepS(k.arc, dt)) m = true; if (k.arc.t > 0 && k.arc.x > k.arc.t * 0.9) k.arc.t = 0; }
    draw();
    return m || keys.some((k) => k.arc.t > 0);
  });
  bag.add(B.unregister);

  let lit = null;
  const flip = (k) => { bits[k.i] ^= 1; k.h.t = bits[k.i] ? UP : LOW; k.arc.t = hop; };
  const mids = keys.map((k) => P(k.x, 0, UP));
  function point(q) {
    let k = null;
    if (q) {
      const near = mids.reduce((b, m, i) => (Math.hypot(m[0] - q[0], m[1] - q[1]) < Math.hypot(mids[b][0] - q[0], mids[b][1] - q[1]) ? i : b), 0);
      if (Math.hypot(mids[near][0] - q[0], mids[near][1] - q[1]) < 26) k = keys[near];
    }
    if (k !== lit) {
      if (lit) lit.s.sil.classList.remove("hi");
      lit = k;
      if (k) { flip(k); k.s.sil.classList.add("hi"); }
    }
    if (!q) { const want = bitsOf(REST); keys.forEach((kk) => { if (bits[kk.i] !== want[kk.i]) flip(kk); }); }
    show();
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hop = v; }, destroy: bag.dispose };
}

hairline({
  name: "binary",
  means: "A byte of eight bit keys: each key the pointer crosses flips, hopping up to 1 or down to 0, and the read-out counts its value.",
  rules: [1, 5, 8, 10],
  range: [4, 8, 14],
  mount,
});
