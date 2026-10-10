/**
 * Hash table: three buckets in a row on a table, and nine keys, each a small block with its number in dots on top,
 * each chained into the bucket its number lands in by key mod 3 (3, 6, 9 in the first; 1, 4, 7 in the second; 2, 5,
 * 8 in the third). The hash function stands in front of them: a dial with three notches, one aimed at each bucket,
 * and a needle. At rest the table is full. Bring the pointer over it and it is filled again, key by key: each key
 * comes down over the dial, the needle steps once round the notches for every unit of the key, counting it out mod 3,
 * and the key glides to the bucket the needle stopped on and drops onto its chain; when all nine are in, they lift out
 * together and it starts again, for as long as the pointer stays. The bucket taking a key takes the bright edge. The
 * read-out names the key and its bucket; the slider is the time per key, in ms.
 *
 * Buckets and keys are rounded boxes, a silhouette and one crease, painted back to front and bottom up. The hit test
 * is a fixed box round the table's resting outline.
 */
const { Cam, circ, clamp, seg, facing, fit, flatDot, lerp, open, place, prism, proj, rings, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const NB = 3, BX = 30, KS = 10, KH = 6, KP = 7, HASH = [BX, -32, 0], DIAL = 11, OVER = 20, TOP = 46, LIFT = 26;
// the notch for each bucket on the dial, 120 degrees apart, bucket 1 straight toward the buckets
const NOTCH = (b) => Math.PI / 2 - ((b - 1) * 2 * Math.PI) / 3;
const bucketX = (b) => b * BX;
const EASE = (u) => u * u * (3 - 2 * u);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const C = Cam(45, 0.5, 2.7);
  fit(C, [[-16, -46, -3], [BX * 2 + 16, 14, -3], [BX * 2 + 16, -46, -3], [-16, 14, -3], [HASH[0], HASH[1], TOP], [BX, 0, 3 * KP + LIFT]], 200, 170);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  // the table, the hash point above it, the buckets, then the keys
  const [tr, ti] = rings(-16, -46, BX * 2 + 16, 14, 7, 2);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  // the hash function: a dial, its three notches, and the needle that counts a key out round them
  const dialAt = (r) => r.map((q) => ({ ...q, u: q.u + HASH[0], v: q.v + HASH[1] }));
  put(solid(g), prism(P, front, dialAt(circ(DIAL, 40)), dialAt(circ(DIAL - 1.4, 40)), 0, 3));
  const onDial = (a, r) => P(HASH[0] + r * Math.cos(a), HASH[1] + r * Math.sin(a), 3);
  [0, 1, 2].forEach((b) => place(flatDot(g, C, 0.8, "dot m"), onDial(NOTCH(b), DIAL - 3)));
  const needle = mk("path", { class: "nf sil" }, g);
  const drop = mk("path", { class: "nf dash" }, g);
  const buckets = Array.from({ length: NB }, (_, b) => {
    const el = solid(g), [r, i] = rings(bucketX(b) - 9, -9, bucketX(b) + 9, 9, 3, 1);
    put(el, prism(P, front, r, i, 0, 2));
    return el;
  });
  const keysG = mk("g", {}, g), [kr, ki] = rings(-KS / 2, -KS / 2, KS / 2, KS / 2, 2, 0.8);
  const shift = (r, x, y) => r.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  // keys 1..9: their bucket and their place in its chain
  const keys = Array.from({ length: 9 }, (_, k) => {
    const id = k + 1, b = id % NB, depth = Math.floor(k / NB), el = solid(keysG);
    return { id, b, depth, el, dots: Array.from({ length: id }, () => flatDot(el.g, C, 0.55, "dot m")) };
  });
  const DOT = (id, k) => { const c = k % 3, r = Math.floor(k / 3); return [(c - 1) * 2.4, (r - 1) * 2.4]; };

  /** Where key k stands, t through its insertion: down over the dial, held while it is counted, then over and down onto its chain. */
  function pos(key, t) {
    const x = bucketX(key.b), z = 2 + key.depth * KP;
    const d = EASE(clamp(t / 0.15, 0, 1)), a = EASE(clamp((t - 0.6) / 0.28, 0, 1)), c = EASE(clamp((t - 0.82) / 0.18, 0, 1));
    return [lerp(HASH[0], x, a), lerp(HASH[1], 0, a), lerp(lerp(lerp(TOP, OVER, d), z + 14, a), z, c)];
  }
  /** The needle's angle, t through a key: it steps once per unit of the key, notch to notch, then swings back to 0. */
  function hand(key, t) {
    const s = key.id * clamp((t - 0.15) / 0.4, 0, 1), k = Math.floor(s), u = EASE(s - k);
    const counted = NOTCH(0) - ((k + u) * 2 * Math.PI) / 3, home = NOTCH(0) - (Math.ceil(key.id / 3) * 3 * 2 * Math.PI) / 3;
    return lerp(counted, home, EASE(clamp((t - 0.7) / 0.3, 0, 1)));
  }
  // the cycle, in ms since it started: key k goes in at k * per; then a pause; then all lift out together
  let t0 = null, on = false, lit = null, settle = null; // settle: on leave, every key glides home from where it was
  const span = () => 9 * per + 900, clearMs = 700;
  function draw(now) {
    const home = settle ? EASE(clamp((now - settle.s) / clearMs, 0, 1)) : 1;
    const e = t0 === null ? Infinity : now - t0, out = t0 === null ? 0 : EASE(clamp((e - span()) / clearMs, 0, 1));
    let busy = null;
    for (const key of keys) {
      const t = t0 === null ? 1 : clamp((e - (key.id - 1) * per) / per, 0, 1), shown = t0 === null || (e >= (key.id - 1) * per && out < 1);
      key.el.g.setAttribute("display", shown ? "inline" : "none");
      if (!shown) continue;
      if (t > 0 && t < 1) busy = key;
      const to = pos(key, t), [x, y, z] = settle ? to.map((v, i) => lerp(settle.from[key.id - 1][i], v, home)) : [to[0], to[1], to[2] + out * LIFT];
      put(key.el, prism(P, front, shift(kr, x, y), shift(ki, x, y), z, z + KH));
      key.dots.forEach((d, k) => { const [u, v] = DOT(key.id, k); place(d, P(x + u, y + v, z + KH)); });
      key.at = [x, y, z];
    }
    // painted back to front, bottom up
    const order = keys.filter((k) => k.at).sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]) || a.at[2] - b.at[2]);
    if (order.some((k, i) => keysG.children[i] !== k.el.g)) order.forEach((k) => keysG.append(k.el.g));
    const tb = busy ? clamp((e - (busy.id - 1) * per) / per, 0, 1) : 0, ang = busy ? hand(busy, tb) : NOTCH(0);
    needle.setAttribute("d", seg(onDial(ang + Math.PI, 2), onDial(ang, DIAL - 2.5)));
    drop.setAttribute("d", busy && tb > 0.55 ? open([onDial(NOTCH(busy.b), DIAL), P(bucketX(busy.b), 0, 2)]) : "");
    const hot = busy ? buckets[busy.b] : null;
    if (hot !== lit) { if (lit) lit.sil.classList.remove("hi"); lit = hot; if (hot) hot.sil.classList.add("hi"); }
    if (busy) read.textContent = `key ${busy.id} → bucket ${busy.b}`;
    // the cycle ends when the keys have lifted out; another starts while the pointer stays
    if (t0 !== null && e >= span() + clearMs) t0 = on && !reducedMotion() ? now : null;
    if (t0 === null && !on) read.textContent = "rest";
    if (settle && home >= 1) settle = null;
    return t0 !== null || !!settle;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  // the hit test: a fixed box round the table and the hash point at rest
  const corners = [[-16, -46, 0], [BX * 2 + 16, 14, 0], [BX * 2 + 16, -46, 0], [-16, 14, 0], [HASH[0], HASH[1], TOP]].map((q) => P(...q));
  const box = [Math.min(...corners.map((c) => c[0])) - 16, Math.max(...corners.map((c) => c[0])) + 16, Math.min(...corners.map((c) => c[1])) - 16, Math.max(...corners.map((c) => c[1])) + 16];
  function point(p) {
    on = !!p && p[0] > box[0] && p[0] < box[1] && p[1] > box[2] && p[1] < box[3];
    const now = performance.now();
    if (on && t0 === null && !reducedMotion()) { t0 = now; settle = null; }
    if (!on && t0 !== null) {
      // stop: whatever is out goes straight home, the keys not yet out come from above the dial
      settle = { s: now, from: keys.map((k) => (k.el.g.getAttribute("display") === "none" ? [HASH[0], HASH[1], TOP] : k.at)) };
      t0 = null;
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = v; }, destroy: bag.dispose };
}

hairline({
  name: "hashtable",
  means: "A hash table: a dial counts each key out mod 3, and the key drops onto the chain of the bucket the needle stops on.",
  rules: [2, 5, 7, 10],
  range: [1100, 1500, 2100],
  mount,
});
