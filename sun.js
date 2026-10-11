/**
 * Sun: the sun face on, a round disc with a ring inside its rim and a crown of rays round it, long and short in turn.
 * Bring the pointer near and it shines on it: the rays on the pointer's side stretch out toward it, the nearer the
 * pointer the further, the rays on the far side draw in, and the whole crown turns slowly; leave and the rays settle
 * back even and it stops turning. The disc takes the bright edge when the pointer is on it. The read-out says which way
 * it is shining and how warm it is there; the slider is how far the rays reach.
 *
 * The disc is a circle and its ring an open circle inside it; each ray is a slim spike, its length a spring. The
 * pointer is read as an angle and a distance from the sun's centre.
 */
const { clamp, mk, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const CX = 200, CY = 160, R = 56, GAP = 10, N = 24;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const g = mk("g", {}, svg), rays = mk("path", { class: "sil" }, g), disc = mk("path", { class: "sil" }, g), ring = mk("path", { class: "nf" }, g);
  const circle = (r, n = 96) => poly(Array.from({ length: n }, (_, k) => [CX + r * Math.cos((k / n) * 2 * Math.PI), CY + r * Math.sin((k / n) * 2 * Math.PI)]));
  disc.setAttribute("d", circle(R)); ring.setAttribute("d", circle(R - 9));
  const len = Array.from({ length: N }, () => spring(1, { k: 60, c: 13, eps: 0.002 })), spin = spring(0, { k: 8, c: 6, eps: 0.003 });
  let turn = 0, on = false;
  function draw() {
    rays.setAttribute("d", len.map((s, k) => {
      const a = turn + (k / N) * 2 * Math.PI, base = k % 2 ? 0.55 : 1, L = reach * base * s.x, w = k % 2 ? 0.05 : 0.075, r0 = R + GAP;
      return poly([[CX + r0 * Math.cos(a - w), CY + r0 * Math.sin(a - w)], [CX + (r0 + L) * Math.cos(a), CY + (r0 + L) * Math.sin(a)], [CX + r0 * Math.cos(a + w), CY + r0 * Math.sin(a + w)]]);
    }).join(""));
  }
  draw();

  let aim = 0, near = 0;
  const B = register(stage, (dt) => {
    let m = stepS(spin, dt);
    if (!reducedMotion()) turn += spin.x * dt;
    // each ray stretches by how squarely it faces the pointer, and the turning crown carries them through the stretch
    len.forEach((s, k) => { const a = turn + (k / N) * 2 * Math.PI, f = Math.max(0, Math.cos(a - aim)); s.t = on ? 0.55 + (0.3 + 1.0 * near) * f * f : 1; if (stepS(s, dt)) m = true; });
    draw();
    return m || Math.abs(spin.x) > 0.003 || on;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (q) {
      const dx = q[0] - CX, dy = q[1] - CY, d = Math.hypot(dx, dy);
      aim = Math.atan2(dy, dx); near = clamp(1 - (d - R) / 160, 0, 1); spin.t = 0.25;
      const dir = ["e", "se", "s", "sw", "w", "nw", "n", "ne"][(Math.round(aim / (Math.PI / 4)) + 8) % 8];
      read.textContent = d < R ? "shining · right on it" : `shining ${dir} · ${Math.round(40 + 60 * near)}% warm`;
    } else { spin.t = 0; read.textContent = "rest"; }
    disc.classList.toggle("hi", !!q && Math.hypot(q[0] - CX, q[1] - CY) < R);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; draw(); }, destroy: bag.dispose };
}

hairline({
  name: "sun",
  means: "The sun: bring the pointer near and the rays on its side stretch out toward it as the crown turns; leave and they settle even.",
  rules: [1, 2, 7, 8],
  range: [18, 28, 40],
  mount,
});
