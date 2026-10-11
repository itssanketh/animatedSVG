/**
 * Senbonzakura: Byakuya's sword from Bleach, a slim katana held point up, its round guard and wrapped hilt below. Its
 * release is "scatter": bring the pointer near and the blade breaks apart from the point down into a thousand cherry
 * blossom petals that stream off along a curve and swirl round the pointer in a turning cloud; leave and they stream
 * home and fit back together into the blade. The read-out names the release and counts the petals in the air; the
 * slider is how many petals the blade makes.
 *
 * The blade is a closed shape cut short as the petals leave it; each petal is a small notched shape with its own home
 * on the blade, its own place in the swirl and its own delay, flying along a bowed path between them, spinning as it
 * goes: the flowing, swirling line of anime motion drawn as many small marks.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const BX = 200, BASE = 214, TIP = 40, GRIP = 302, TAU = 2 * Math.PI;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let count = Math.round(value);
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const blade = el("sil"), ridge = el("nf"), guard = el("sil"), hilt = el("sil"), wrap = el("nf"), petals = el("sil");
  // the blade's centre line: a gentle curve back from the guard to the point
  const spine = (t) => [BX + 9 * t * t, lerp(BASE, TIP, t)];
  // measured from the reference: a long hilt, about half the blade, bound in diamonds, with a cap at its end; a small
  // round guard and a collar where the blade leaves it
  hilt.setAttribute("d", poly([[BX - 6, BASE + 7], [BX + 6, BASE + 7], [BX + 5.5, GRIP], [BX - 5.5, GRIP]]) + poly([[BX - 6.5, GRIP], [BX + 6.5, GRIP], [BX + 6, GRIP + 8], [BX - 6, GRIP + 8]]));
  wrap.setAttribute("d", Array.from({ length: 7 }, (_, i) => { const y = BASE + 10 + i * 11; return poly([[BX, y], [BX + 4.5, y + 5.5], [BX, y + 11], [BX - 4.5, y + 5.5]]); }).join(""));
  guard.setAttribute("d", poly(Array.from({ length: 28 }, (_, k) => [BX + 11 * Math.cos((k / 28) * TAU), BASE + 4 + 3.6 * Math.sin((k / 28) * TAU)])) + poly([[BX - 5.5, BASE - 6], [BX + 5.5, BASE - 6], [BX + 5.5, BASE + 1], [BX - 5.5, BASE + 1]]));
  const go = spring(0, { k: 9, c: 6, eps: 0.004 });
  let clock = 0, aim = [300, 120], on = false;
  // each petal: where it sits on the blade, where it flies in the swirl, how late it leaves
  const homes = () => Array.from({ length: count }, (_, i) => { const t = 1 - i / count; return { t, side: ((i * 7) % 5) / 4 - 0.5, r: 18 + ((i * 37) % 23) * 2.6, a: (i * 2.39996) % TAU, delay: (i / count) * 0.55, spin: (i * 1.7) % TAU }; });
  let P = homes();
  const petal = (c, ang, s) => { const pts = [[0, -s], [0.62 * s, -0.35 * s], [0.5 * s, 0.5 * s], [0, 0.22 * s], [-0.5 * s, 0.5 * s], [-0.62 * s, -0.35 * s]]; return poly(pts.map(([x, y]) => [c[0] + x * Math.cos(ang) - y * Math.sin(ang), c[1] + x * Math.sin(ang) + y * Math.cos(ang)])); };
  function draw() {
    const p = go.x;
    // the blade, cut back from the point by as much as has scattered
    const keep = clamp(1 - p * 1.25, 0, 1);
    if (keep > 0.02) {
      const L = Array.from({ length: 12 }, (_, i) => spine((i / 11) * keep * (keep > 0.97 ? 0.93 : 1))), w = (t) => 4.2 * (1 - 0.25 * t);
      const tipPt = keep > 0.97 ? [spine(1)] : [];
      blade.setAttribute("d", poly([...L.map((q, i) => [q[0] - w((i / 11) * keep), q[1]]), ...tipPt, ...L.slice().reverse().map((q, i) => [q[0] + w(((11 - i) / 11) * keep), q[1]])]));
      const H = Array.from({ length: 40 }, (_, i) => { const t = (i / 39) * keep * 0.94, q = spine(t); return [q[0] - 1.6 + 0.9 * Math.sin(t * 90), q[1]]; });
      ridge.setAttribute("d", open(H) + (keep > 0.97 ? open([[spine(0.93)[0] - 4.2, spine(0.93)[1]], [spine(0.93)[0] + 3.2, spine(0.93)[1] + 2]]) : ""));
    } else { blade.setAttribute("d", ""); ridge.setAttribute("d", ""); }
    // the petals in the air: along a bowed path from home to their place in the turning swirl
    let flying = 0;
    petals.setAttribute("d", P.map((q) => {
      const f = clamp((p - q.delay) / 0.45, 0, 1);
      if (f <= 0) return "";
      flying++;
      const e = f * f * (3 - 2 * f), h = spine(q.t), home = [h[0] + q.side * 6, h[1]], a = q.a + clock * 1.6 * (1 + q.r / 80), sw = [aim[0] + q.r * Math.cos(a), aim[1] + q.r * 0.7 * Math.sin(a)];
      const d = [sw[0] - home[0], sw[1] - home[1]], n = [-d[1], d[0]], bow = Math.sin(Math.PI * e) * 0.35;
      return petal([home[0] + d[0] * e + n[0] * bow, home[1] + d[1] * e + n[1] * bow], q.spin + clock * 3 * e, 4.6);
    }).join(""));
    return flying;
  }
  draw();

  const B = register(stage, (dt) => {
    const m = stepS(go, dt);
    if (!reducedMotion()) clock += dt;
    const n = draw();
    read.textContent = on ? `Scatter, Senbonzakura · ${n} petals` : n ? "returning" : "rest";
    return m || on || go.x > 0.002;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (q) aim = [clamp(q[0], 95, 305), clamp(q[1], 80, 225)];
    go.t = on ? 1.45 : 0;
    B.wake();
  }
  point(null);
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { count = Math.round(v); P = homes(); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "senbonzakura",
  means: "Byakuya's Senbonzakura: bring the pointer near and the blade scatters into petals that swirl round it; leave and they reform the blade.",
  rules: [1, 7, 8, 10],
  range: [30, 60, 100],
  mount,
});
