/**
 * Context: Claude's context window as a long tray with ten places, holding a summary block at its head and tokens after
 * it. Bring the pointer over it and the conversation goes on: a token drops into the next free place, then the next;
 * when the tray is full it is compacted: every block slides up to the head and folds into it, and the summary grows a
 * little taller for all it now holds; then the tokens start filling again, for as long as the pointer stays. Leave and
 * it stops once the block in the air has landed. The block that is moving takes the bright edge. The read-out gives
 * how full the window is; the slider is the time per token, in ms.
 *
 * Each block is a rounded box, a silhouette and one crease, painted back to front along the tray. The hit test is a
 * fixed box round the tray's resting outline.
 */
const { Cam, clamp, facing, fit, lerp, prism, proj, rings, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const N = 10, PITCH = 11, W = 9, D = 14, H = 5, DROP = 26, REST = 7;
const slot = (i) => i * PITCH;
const EASE = (u) => u * u * (3 - 2 * u);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const C = Cam(45, 0.5, 2.6), TRAY = slot(N - 1);
  fit(C, [[-9, -D / 2 - 3, -3], [TRAY + 9, D / 2 + 3, -3], [TRAY + 9, -D / 2 - 3, -3], [-9, D / 2 + 3, -3], [TRAY, 0, DROP + H], [0, 0, 20]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [tr, ti] = rings(-9, -D / 2 - 3, TRAY + 9, D / 2 + 3, 5, 1.6);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  const blocksG = mk("g", {}, g), [ring, inner] = rings(-W / 2, -D / 2, W / 2, D / 2, 2, 0.9);
  const shift = (x) => [ring, inner].map((r) => r.map((q) => ({ ...q, u: q.u + x })));
  const blocks = Array.from({ length: N }, () => ({ el: solid(blocksG) }));

  // the window: n places filled, the first being the summary, `rounds` compactions tall
  let n = REST, rounds = 1, act = null, on = false, lit = null;
  const sumH = () => H + 2 + rounds * 2;
  function drawBlock(b, x, z, h, shown) {
    b.el.g.setAttribute("display", shown ? "inline" : "none");
    if (shown) { const [r, i] = shift(x); put(b.el, prism(P, front, r, i, z, z + h)); }
  }
  function draw(now) {
    if (act && now - act.t0 >= act.dur) {
      if (act.kind === "drop") n++; else { n = 1; rounds = Math.min(rounds + 1, 5); }
      act = null;
    }
    if (!act && on && !reducedMotion()) act = n < N ? { kind: "drop", t0: now, dur: per } : { kind: "fold", t0: now, dur: per * 2.2 };
    const t = act ? clamp((now - act.t0) / act.dur, 0, 1) : 0;
    blocks.forEach((b, i) => {
      if (i === 0) return drawBlock(b, 0, 0, act && act.kind === "fold" ? lerp(sumH(), sumH() + 2, EASE(clamp((t - 0.6) / 0.4, 0, 1))) : sumH(), n > 0);
      if (act && act.kind === "drop" && i === n) return drawBlock(b, slot(i), (1 - EASE(t)) * DROP, H, true);
      // folding: each token slides up to the head, the far ones first, and is gone as it reaches it
      if (act && act.kind === "fold" && i < n) { const u = EASE(clamp((t - (i / N) * 0.3) / 0.6, 0, 1)); const x = lerp(slot(i), 0, u); return drawBlock(b, x, 0, H, x > W * 0.9); }
      drawBlock(b, slot(i), 0, H, i < n);
    });
    // painted back to front: the head first
    const hot = act ? (act.kind === "drop" ? blocks[n] : blocks[0]) : null;
    if (hot !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; if (hot) hot.el.sil.classList.add("hi"); }
    read.textContent = act && act.kind === "fold" ? "compacting" : on || act ? `context ${n + (act ? 1 : 0)} / ${N}` : "rest";
    return !!act || on;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  // the hit test: a fixed box round the tray at rest
  const pts = [[-9, -D / 2 - 3, 0], [TRAY + 9, D / 2 + 3, 0], [TRAY + 9, -D / 2 - 3, 0], [-9, D / 2 + 3, 0]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])) - 16, Math.max(...pts.map((p) => p[0])) + 16, Math.min(...pts.map((p) => p[1])) - 50, Math.max(...pts.map((p) => p[1])) + 16];
  function point(q) {
    on = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3];
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = v; }, destroy: bag.dispose };
}

hairline({
  name: "context",
  means: "Claude's context window: tokens fill the tray one by one, and when it is full they fold into one summary block.",
  rules: [2, 5, 7, 9],
  range: [300, 480, 750],
  mount,
});
