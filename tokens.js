/**
 * Tokens: a model's output as it streams, tokens as blocks lying end to end on a belt, each as long as its word. Bring the pointer
 * over it and the model generates: a token at a time, at a steady rate, a new block drops onto the right end of the belt, the row
 * slides along to make room, and the oldest drops off the left end. The newest token takes the bright edge. Leave and the stream
 * stops where it is, the last token dropping into place. The read-out counts the tokens and gives the rate. The slider is the
 * rate, in tokens a second.
 *
 * Each block is a rounded box, a silhouette and one crease, on springs, painted from the far end to the near one; the belt never
 * moves, and the pointer is read against its resting outline.
 */
const { Cam, facing, fit, hull, mk, prism, proj, rings, ringAt, spring, stepS, disposer, pointer, put, register, solid } = HL;

// the sentence it streams, a block per token, each as long as its word
const WORDS = "the model writes one token at a time and each one follows from all the ones before it".split(" ");
const L0 = -60, L1 = 60, GAP = 2, D = 8, H = 4.5, DROP = 18;
const lenOf = (w) => 5 + w.length * 2.6;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let rate = value;
  // turned so the belt runs across the screen, as text is read
  const C = Cam(22, 0.5, 2.7);
  fit(C, [[L0 - 6, -8, -3], [L1 + 6, 8, -3], [L1 + 6, -8, -3], [L0 - 6, 8, -3], [L1, 0, H + DROP], [L0, 0, H], [L0, 0, -26]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [br, bi] = rings(L0 - 6, -8, L1 + 6, 8, 4, 1.4);
  put(solid(g), prism(P, front, br, bi, -3, 0));
  const layer = mk("g", {}, g);
  let count = 0, toks = [];
  /** A new token: its block, placed by its right end, dropping from above. */
  function add(right, z) { const w = WORDS[count % WORDS.length], t = { w, len: lenOf(w), s: solid(layer), x: spring(right), z: spring(z, { k: 140, c: 14 }) }; count++; toks.push(t); return t; }
  // at rest the belt holds the first few tokens, ending at its right end
  { let r = L1; const first = []; while (true) { const w = WORDS[first.length]; if (r - lenOf(w) < L0) break; first.push(w); r -= lenOf(w) + GAP; } let x = L0 + (L1 - L0 - first.reduce((s, w) => s + lenOf(w) + GAP, -GAP)); first.forEach(() => { const t = add(0, 0); t.x = spring(x + t.len); x += t.len + GAP; }); }
  // the right ends each block slides to: packed from the belt's right end
  function settle() {
    let r = L1;
    for (let i = toks.length - 1; i >= 0; i--) {
      const t = toks[i];
      // pushed past the belt's left end, it goes over the edge and drops
      if (r - t.len < L0 - 1) { t.x.t = L0 - 1 + Math.min(t.len, 6); t.z.t = -24; t.gone = true; } else t.x.t = r;
      r -= t.len + GAP;
    }
  }

  function draw() {
    for (const t of toks) {
      const x1 = t.x.x, x0 = x1 - t.len, [r, i] = rings(x0, -D / 2, x1, D / 2, 1.8, 0.8);
      put(t.s, prism(P, front, r, i, t.z.x, t.z.x + H));
    }
  }
  draw();

  let on = false, last = 0, lit = null;
  const B = register(stage, (dt, now) => {
    let m = false;
    if (on && now - last > 1000 / rate) {
      last = now;
      const t = add(L1 + 4, DROP); t.z.t = 0; settle();
      if (lit) lit.s.sil.classList.remove("hi"); lit = t; t.s.sil.classList.add("hi");
      read.textContent = `${count} tokens · ${rate}/s`;
    }
    for (const t of toks) { if (stepS(t.x, dt)) m = true; if (stepS(t.z, dt)) m = true; }
    // the ones that have fallen off are gone
    toks = toks.filter((t) => { const gone = t.gone && t.z.x < -20; if (gone) t.s.g.remove(); return !gone; });
    draw();
    return m || on;
  });
  bag.add(B.unregister);

  const belt = hull([...ringAt(P, br, 0), ...ringAt(P, br, H + DROP)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) {
    const n = !!q && inside(q, belt);
    if (n && !on) { on = true; last = 0; }
    if (!n && on) { on = false; read.textContent = count > 0 ? `${count} tokens · stopped` : "rest"; }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = v; }, destroy: bag.dispose };
}

hairline({
  name: "tokens",
  means: "A token stream: hover and the model writes, a token at a time dropping onto the belt, the row sliding along, the oldest falling off.",
  rules: [1, 2, 7, 8, 10],
  range: [2, 4, 8],
  mount,
});
