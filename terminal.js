/**
 * Terminal: a Claude Code window, one thick plate facing you, three dots in its title bar, a prompt and the answer
 * under it, each line of text a stroke as long as the line. At rest it holds a finished exchange. Bring the pointer
 * over it and it is played again: the window clears, the prompt line is typed out behind the cursor, a moment's
 * thought, then the answer streams in line by line, each growing from the left; then it clears and the next one
 * starts, for as long as the pointer stays. Leave and it shows the finished exchange. The window takes the bright
 * edge while the pointer is on it. The read-out says who is writing; the slider is the time per line, in ms.
 *
 * The window is a plate: the face turned away, the sides, the face toward you; the text is drawn on the face. The
 * hit test is the window's outline at rest.
 */
const { clamp, mk, poly, register, reducedMotion, disposer, pointer } = HL;

const K = 120, CX = 200, CY = 160, T = 8, WU = 1.3, WV = 0.95, RR = 0.08, LH = 0.17, X0 = -1.12;
// the exchanges: the prompt's length, then each line of the answer, as fractions of the full width
const TALKS = [[0.55, [0.92, 0.7, 0.84, 0.4]], [0.38, [0.6, 0.95, 0.88, 0.75, 0.3]], [0.7, [0.8, 0.5, 0.9]]];
const S = (u, v, d) => [CX + u * K - (d - T / 2) * 0.7, CY - v * K + (d - T / 2) * 0.7];
const round = (w, h, r) => { const out = []; [[w - r, h - r, 0], [-w + r, h - r, 1], [-w + r, -h + r, 2], [w - r, -h + r, 3]].forEach(([x, y, q]) => { for (let i = 0; i <= 6; i++) { const a = ((q + i / 6) * Math.PI) / 2; out.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } }); return out; };
const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const g = mk("g", {}, svg), loop = round(WU, WV, RR);
  const f = loop.map(([u, v]) => S(u, v, T)), b = loop.map(([u, v]) => S(u, v, 0));
  mk("path", { class: "sil", d: poly(b) }, g);
  mk("path", { class: "fo", d: f.map((q, j) => poly([q, f[(j + 1) % f.length], b[(j + 1) % f.length], b[j]])).join("") }, g);
  const face = mk("path", { class: "sil", d: poly(f) }, g);
  // the title bar: its rule and three dots
  const ring = (u, v, r) => poly(Array.from({ length: 16 }, (_, i) => S(u + r * Math.cos((i / 16) * 2 * Math.PI), v + r * Math.sin((i / 16) * 2 * Math.PI), T)));
  mk("path", { class: "nf lo", d: poly([S(-WU, WV - 0.2, T), S(WU, WV - 0.2, T)]).replace(/Z$/i, "") + [0, 1, 2].map((i) => ring(-WU + 0.14 + i * 0.12, WV - 0.1, 0.035)).join("") }, g);
  const bullet = mk("path", { class: "sil" }, g), prompt = mk("path", { class: "nf sil" }, g), text = mk("path", { class: "nf lo" }, g), cursor = mk("path", { class: "nf sil" }, g);
  const line = (v, x0, w) => (w <= 0.001 ? "" : `M${S(x0, v, T).join(" ")}L${S(x0 + w, v, T).join(" ")}`);
  const span = 2 * WU - 0.48;

  /** Draws exchange n, t ms into it: the prompt typed, a pause, the answer streamed line by line. */
  function show(n, t) {
    const [p, lines] = TALKS[n % TALKS.length], top = WV - 0.38, chev = 0.05;
    const typed = clamp(t / (per * 1.2), 0, 1) * p * span, x = X0 + 0.14;
    prompt.setAttribute("d", `M${S(X0 - chev / 2, top + chev, T).join(" ")}L${S(X0 + chev / 2, top, T).join(" ")}L${S(X0 - chev / 2, top - chev, T).join(" ")}` + line(top, x, typed));
    const t1 = t - per * 1.6;
    // Claude's answer starts with a round bullet, which appears as it starts to answer
    bullet.setAttribute("d", t1 > 0 ? ring(X0 + 0.01, top - 1.4 * LH, 0.03) : "");
    text.setAttribute("d", lines.map((w, k) => line(top - (k + 1.4) * LH, X0 + 0.12, clamp((t1 - k * per) / per, 0, 1) * w * (span + 0.14))).join(""));
    // the cursor: after the prompt while typing, then after the line being written
    const k = clamp(Math.floor(t1 / per), 0, lines.length - 1), writing = t1 > 0 && t1 < lines.length * per;
    const cx = t1 <= 0 ? x + typed + 0.03 : X0 + 0.12 + clamp((t1 - k * per) / per, 0, 1) * lines[k] * (span + 0.14) + 0.03, cv = t1 <= 0 ? top : top - (k + 1.4) * LH;
    cursor.setAttribute("d", t1 <= 0 || writing ? poly([S(cx, cv + 0.05, T), S(cx + 0.05, cv + 0.05, T), S(cx + 0.05, cv - 0.05, T), S(cx, cv - 0.05, T)]) : "");
    return t1 <= 0 ? "you type" : writing ? "Claude answers" : "done";
  }
  const length = (n) => per * 1.6 + TALKS[n % TALKS.length][1].length * per + per * 1.4;

  let on = false, n = 0, t0 = 0;
  function draw(now) {
    if (!on || reducedMotion()) { show(0, 1e9); read.textContent = on ? "done" : "rest"; return false; }
    if (now - t0 > length(n)) { n++; t0 = now; }
    read.textContent = show(n, now - t0);
    return true;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  function point(q) {
    const was = on;
    on = !!q && inPoly(q, f);
    if (on && !was) { n = 0; t0 = performance.now(); }
    face.classList.toggle("hi", on);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = v; }, destroy: bag.dispose };
}

hairline({
  name: "terminal",
  means: "A Claude Code window: hover it and a prompt is typed behind the cursor, then the answer streams in, line by line.",
  rules: [4, 7, 10],
  range: [260, 420, 650],
  mount,
});
