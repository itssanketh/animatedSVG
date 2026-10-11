/**
 * Piano: two octaves of a keyboard instrument, fourteen white keys and the ten black keys raised between them in their
 * twos and threes, set in a case with cheeks at the ends and a rail behind. Sweep the pointer over the keys and you
 * play them: each key the pointer crosses goes down, holds for a moment and comes back up, so a run of keys follows the
 * pointer like a glissando; leave and the last notes come up and it is still. The key under the pointer takes the
 * bright edge. The read-out names the note; the slider is how long a note holds, in milliseconds.
 *
 * The case and every key are rounded blocks, a silhouette and one crease, the white keys painted far to near and the
 * black keys over them. The pointer is read on the plane of the keys' tops, black keys first, and the hit test is each
 * key's footprint at rest.
 */
const { Cam, clamp, facing, fit, mk, prism, proj, put, rings, spring, stepS, unproj, disposer, pointer, register, solid } = HL;

const W = 3, LEN = 15, BW = 1.8, BLEN = 9.5, BASE = 2, WH = 1.5, BH = 1.4, DIP = 0.9;
const WHITE = "CDEFGAB", SHARP = { 0: "C#", 1: "D#", 3: "F#", 4: "G#", 5: "A#" };
const X0 = -7 * W;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let hold = value;
  const C = Cam(45, 0.5, 5.2);
  fit(C, [[X0 - 2.4, -4.5, 0], [-X0 + 2.4, LEN + 0.6, 0], [X0 - 2.4, LEN + 0.6, 0], [-X0 + 2.4, -4.5, 0], [X0, -4.5, 9]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the case: a bed under the keys, a rail behind them, a cheek at each end
  const bed = solid(g), rail = solid(g), cheekL = solid(g);
  put(bed, prism(P, front, ...rings(X0 - 2.4, -4.5, -X0 + 2.4, LEN + 0.6, 1, 0.6), 0, BASE));
  put(rail, prism(P, front, ...rings(X0 - 2.4, -4.5, -X0 + 2.4, -0.3, 1, 0.6), BASE, BASE + WH + 4));
  put(cheekL, prism(P, front, ...rings(X0 - 2.4, -0.3, X0 - 0.2, LEN + 0.6, 0.8, 0.5), BASE, BASE + WH + 1.6));

  const keys = [];
  for (let i = 0; i < 14; i++) keys.push({ name: WHITE[i % 7] + (4 + Math.floor(i / 7)), black: false, x0: X0 + i * W + 0.07, x1: X0 + (i + 1) * W - 0.07, y0: 0, y1: LEN });
  for (let i = 0; i < 14; i++) if (SHARP[i % 7]) { const c = X0 + (i + 1) * W; keys.push({ name: SHARP[i % 7] + (4 + Math.floor(i / 7)), black: true, x0: c - BW / 2, x1: c + BW / 2, y0: 0, y1: BLEN }); }
  // white keys left to right, each nearer than the last along the row; black keys over them
  for (const k of keys) { k.s = solid(g); k.sp = spring(0, { k: 320, c: 20, eps: 0.002 }); k.until = 0; k.foot = rings(k.x0, k.y0, k.x1, k.y1, k.black ? 0.4 : 0.3, k.black ? 0.4 : 0.25); }
  const cheekR = solid(g);
  put(cheekR, prism(P, front, ...rings(-X0 + 0.2, -0.3, -X0 + 2.4, LEN + 0.6, 0.8, 0.5), BASE, BASE + WH + 1.6));
  const draw = () => { for (const k of keys) { const z0 = BASE + (k.black ? WH : 0) - k.sp.x * DIP; put(k.s, prism(P, front, ...k.foot, z0, z0 + (k.black ? BH : WH))); } };
  draw();

  let over = null;
  const B = register(stage, (dt) => {
    const now = performance.now();
    let m = false;
    for (const k of keys) { if (k !== over && now > k.until) k.sp.t = 0; if (stepS(k.sp, dt)) m = true; if (k.sp.t && k !== over) m = true; }
    draw();
    return m;
  });
  bag.add(B.unregister);

  function point(q) {
    let hit = null;
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], BASE + WH), z2 = unproj(C, q[0], q[1], BASE + WH + BH);
      hit = keys.find((k) => k.black && z2[0] >= k.x0 && z2[0] <= k.x1 && z2[1] >= k.y0 && z2[1] <= k.y1) || keys.find((k) => !k.black && x >= k.x0 - 0.12 && x <= k.x1 + 0.12 && y >= k.y0 && y <= k.y1) || null;
    }
    if (hit !== over) {
      if (over) over.s.sil.classList.remove("hi");
      over = hit;
      if (hit) { hit.sp.t = 1; hit.until = performance.now() + hold; hit.s.sil.classList.add("hi"); }
    }
    read.textContent = hit ? hit.name : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hold = clamp(v, 60, 1000); }, destroy: bag.dispose };
}

hairline({
  name: "piano",
  means: "A two-octave piano: sweep the pointer over it and each key it crosses goes down and comes back up, a glissando; leave and it is still.",
  rules: [1, 3, 7, 9],
  range: [120, 300, 700],
  mount,
});
