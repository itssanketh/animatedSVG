/**
 * Envelope: a sealed envelope standing face on, a wax seal on the tip of its flap. Bring the pointer over it and it
 * opens: the flap swings up over the top edge, the seal riding its tip, and once it is open a letter slides up out of
 * the pocket, lines of writing on it, rising a little toward you; leave and the letter slides back in and the flap
 * swings shut. The part under the pointer takes the bright edge. The read-out says what it is doing; the slider is how
 * far the letter comes out.
 *
 * Every part is a thin plate, its face turned away, its sides and its face toward you, painted back to front: the back
 * of the envelope, the flap while it stands open behind the letter, the letter, the pocket in front with its two seams,
 * and the flap again while it lies shut over the pocket. The pointer is read against the parts at rest.
 */
const { clamp, lerp, mk, open, poly, register, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 194, T = 5, W = 1.15, H = 0.72, FLAP = 0.6;
const S = (u, v) => [CX + u * K, CY - v * K];
const EASE = (u) => u * u * (3 - 2 * u);
const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
/** A rectangle with rounded corners, as points. */
const rect = (x0, y0, x1, y1, r) => [[x1 - r, y1, x1, y1 - r], [x0 + r, y1, x0, y1 - r], [x0, y0 + r, x0 + r, y0], [x1, y0 + r, x1 - r, y0]].flatMap(([ax, ay, bx, by], k) => {
  const cx = k === 0 || k === 3 ? x1 - r : x0 + r, cy = k < 2 ? y1 - r : y0 + r, a0 = (k * Math.PI) / 2;
  return Array.from({ length: 5 }, (_, i) => [cx + r * Math.cos(a0 + (i / 4) * (Math.PI / 2)), cy + r * Math.sin(a0 + (i / 4) * (Math.PI / 2))]);
});

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let out = value;
  const g = mk("g", {}, svg);
  /** A thin plate: the face turned away, its sides, the face toward you. */
  const plate = () => { const b = mk("g", {}, g); return { g: b, away: mk("path", { class: "sil" }, b), side: mk("path", { class: "fo" }, b), toward: mk("path", { class: "sil" }, b), lines: mk("path", { class: "nf" }, b) }; };
  function put(p, pts, d0, t = 2.4) {
    const f = pts.map(([u, v]) => S(u, v, d0 + t)), b = pts.map(([u, v]) => S(u, v, d0));
    p.away.setAttribute("d", poly(b));
    p.side.setAttribute("d", f.map((q, i) => poly([q, f[(i + 1) % f.length], b[(i + 1) % f.length], b[i]])).join(""));
    p.toward.setAttribute("d", poly(f));
    return f;
  }
  // back to front: the back, the open flap, the letter, the pocket, the shut flap
  const back = plate(), flapBack = plate(), letter = plate(), pocket = plate(), flapFront = plate();
  const seal = mk("path", { class: "sil" }, g);

  const lid = tween(0), slide = tween(0);
  let on = false, drawn = "";
  function draw(now) {
    const a = EASE(tval(lid, now)), s = EASE(tval(slide, now)), key = a.toFixed(4) + "," + s.toFixed(4);
    if (key === drawn) return;
    drawn = key;
    put(back, rect(-W, -H, W, H, 0.05), 0);
    // the letter: rises out of the pocket by s, a little toward you, its writing riding on it
    const ly = s * out, ld = 2.6 + s * 1.2, lw = W - 0.1, lb = -H + 0.08 + ly, lt = H - 0.08 + ly;
    put(letter, rect(-lw, lb, lw, lt, 0.03), ld, 1.4);
    letter.lines.setAttribute("d", [0.62, 0.86, 0.74, 0.9, 0.5].map((w, k) => { const v = lt - 0.16 - k * 0.12; return v < lb + 0.08 ? "" : open([S(-lw + 0.14, v, ld + 1.4), S(-lw + 0.14 + w * (2 * lw - 0.28), v, ld + 1.4)]); }).join(""));
    // the pocket in front: the whole face, with its two seams from the bottom corners up to the middle
    put(pocket, rect(-W, -H, W, H, 0.05), 4.4, 1.6);
    pocket.lines.setAttribute("d", open([S(-W + 0.02, -H + 0.02), S(0, -0.08), S(W - 0.02, -H + 0.02)]) + (a > 0.5 ? open([S(-W + 0.02, H - 0.04), S(0, -0.08), S(W - 0.02, H - 0.04)]) : ""));
    // the flap: a triangle hinged on the top edge; its tip swings from down over the pocket to up behind the letter
    const tipV = H - FLAP * Math.cos(Math.PI * a), shut = Math.cos(Math.PI * a) > 0, tri = [[-W + 0.04, H], [W - 0.04, H], [0.06, tipV + 0.04 * Math.sign(H - tipV)], [-0.06, tipV + 0.04 * Math.sign(H - tipV)]];
    const flapEl = shut ? flapFront : flapBack, other = shut ? flapBack : flapFront;
    other.g.setAttribute("display", "none"); flapEl.g.setAttribute("display", "inline");
    put(flapEl, tri, shut ? 6 : -1, 1);
    // the wax seal rides the flap's tip
    const sv = lerp(H, tipV, 0.82), sd = shut ? 7 : -1, r = 0.075;
    seal.setAttribute("d", shut ? poly(Array.from({ length: 24 }, (_, k) => S(r * Math.cos((k / 24) * 2 * Math.PI), sv + r * Math.sin((k / 24) * 2 * Math.PI) * Math.abs(Math.cos(Math.PI * a)), sd))) : "");
    if (shut) g.append(seal); else g.insertBefore(seal, letter.g);
    read.textContent = !on && a < 0.01 ? "rest" : s > 0.95 ? "you've got mail" : a > 0.02 ? "opening" : "sealed";
  }
  draw(performance.now());

  const B = register(stage, () => { const now = performance.now(); draw(now); return !tdone(lid, now) || !tdone(slide, now); });
  bag.add(B.unregister);

  // the parts at rest, for the hit test: the flap shut on top, then the pocket, then the back
  const restParts = [[flapFront, [[-W, H], [W, H], [0, H - FLAP]]], [pocket, rect(-W, -H, W, H, 0.05)]].map(([p, pts]) => ({ p, ls: pts.map(([u, v]) => S(u, v, 7)) }));
  let lit = null;
  function point(q) {
    const hit = q ? restParts.find((x) => inPoly(q, x.ls)) : null;
    const was = on;
    on = !!q && (hit || Math.abs(q[0] - CX) < W * K + 30 && Math.abs(q[1] - CY) < H * K + 60);
    if (on !== was) {
      const now = performance.now();
      // opening: the flap first, then the letter; closing: the letter first, then the flap
      if (on) { tset(lid, 1, now, 0); tset(slide, 1, now, reducedMotion() ? 0 : 450); } else { tset(slide, 0, now, 0); tset(lid, 0, now, reducedMotion() ? 0 : 450); }
    }
    const p = hit ? (hit.p === flapFront && tval(lid, performance.now()) > 0.5 ? letter : hit.p) : null;
    if (p !== lit) { if (lit) lit.toward.classList.remove("hi"); lit = p; if (p) p.toward.classList.add("hi"); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { out = clamp(v, 0.25, 0.6); drawn = ""; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "envelope",
  means: "An envelope: bring the pointer over it and the flap swings open and a letter slides up out of it; leave and it seals again.",
  rules: [1, 5, 8, 10],
  range: [0.3, 0.42, 0.55],
  mount,
});
