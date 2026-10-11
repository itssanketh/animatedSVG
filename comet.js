/**
 * Comet: a comet's nucleus, a lumpy rock, inside its haze of coma, its two tails streaming from it: the straight ion tail, which
 * points straight away from the sun, and the broader dust tail, which curves away behind it. The pointer is the sun. Bring it near
 * and the tails swing round to point away from it, growing longer and livelier the closer it comes, their streamers rippling; move
 * it round and they follow, always away. Leave and the sun goes back far off to the upper left and the tails shrink back. The
 * nucleus takes the bright edge while the sun is close. The read-out gives the sun's distance and the tail's length. The slider is
 * how long the tail grows.
 *
 * The nucleus is a plate, its back face, the strips round its edge and its front face; the coma and the tails are open lines
 * behind it. The sun is read from the pointer's place against the nucleus's resting middle, which never moves.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const CX = 168, CY = 132, T = 5;
// the nucleus, a lumpy rock: a ring of radii round it
const ROCK = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 2 * Math.PI, r = 22 + 4 * Math.sin(a * 3 + 1) + 2.6 * Math.cos(a * 5); return [r * Math.cos(a), r * 0.82 * Math.sin(a)]; });
/** How far the tail can run in direction a before it reaches the frame's edge. */
const room = (a) => { const c = Math.cos(a), s = Math.sin(a), lim = [c > 0 ? (388 - CX) / c : c < 0 ? (12 - CX) / c : 1e9, s > 0 ? (308 - CY) / s : s < 0 ? (12 - CY) / s : 1e9]; return Math.min(...lim); };
const S = ([x, y], d) => [CX + x - d * 0.6, CY + y + d * 0.45];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const g = mk("g", {}, svg), ion = mk("path", { class: "nf" }, g), dust = mk("path", { class: "nf lo" }, g), coma = mk("path", { class: "nf lo" }, g);
  const back = mk("path", { class: "sil" }, g), side = mk("path", { class: "fo" }, g), face = mk("path", { class: "sil" }, g), pits = mk("path", { class: "nf lo" }, g);
  // the sun's direction from the comet and how near it is (1 close, 0 far)
  const ang = spring(Math.atan2(-1, -1.4), { k: 30, c: 10 }), near = spring(0.4, { k: 30, c: 10 });
  let clock = 0, spin = 0;

  function draw() {
    const a = ang.x + Math.PI, n = near.x, L = Math.min((110 + 130 * n) * reach, room(ang.x + Math.PI) - 24), c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
    // the ion tail: straight streamers away from the sun, rippling
    ion.setAttribute("d", [-6, -2, 2, 6].map((o, k) => open(Array.from({ length: 24 }, (_, i) => { const t = i / 23, w = Math.sin(t * 9 - clock * 5 + k) * 2.2 * t; return [CX + c * (16 + t * L) + px * (o * (1 + t) + w), CY + s * (16 + t * L) + py * (o * (1 + t) + w)]; }))).join(""));
    // the dust tail: wider, curving back the way the comet came
    dust.setAttribute("d", [0, 1, 2, 3, 4].map((k) => open(Array.from({ length: 24 }, (_, i) => { const t = i / 23, bend = (8 + k * 7) * t * t, w = Math.sin(t * 6 - clock * 3 + k * 1.3) * 1.6 * t; return [CX + c * (14 + t * L * 0.8) + px * (bend + w + (k - 2) * 2), CY + s * (14 + t * L * 0.8) + py * (bend + w + (k - 2) * 2)]; }))).join(""));
    // the coma: a haze of short arcs round the nucleus, wider the nearer the sun
    coma.setAttribute("d", [36, 46].map((r, k) => Array.from({ length: 9 }, (_, j) => { const a0 = (j / 9) * 2 * Math.PI + clock * (0.3 + k * 0.2); return open(Array.from({ length: 4 }, (_, i) => { const b = a0 + i * 0.12; return [CX + (r + 6 * n) * Math.cos(b), CY + (r + 6 * n) * 0.85 * Math.sin(b)]; })); }).join("")).join(""));
    // the nucleus, tumbling slowly
    const cs = Math.cos(spin), sn = Math.sin(spin), rock = ROCK.map(([x, y]) => [x * cs - y * sn, x * sn + y * cs]);
    back.setAttribute("d", poly(rock.map((p) => S(p, 0))));
    side.setAttribute("d", rock.map((p, i) => { const q = rock[(i + 1) % rock.length]; return poly([S(p, 0), S(q, 0), S(q, T), S(p, T)]); }).join(""));
    face.setAttribute("d", poly(rock.map((p) => S(p, T))));
    pits.setAttribute("d", [[-7, -4, 4.4], [7, 5, 3.2], [4, -8, 2.3]].map(([x, y, r]) => { const X = x * cs - y * sn, Y = x * sn + y * cs; return poly(Array.from({ length: 12 }, (_, i) => S([X + r * Math.cos((i / 12) * 2 * Math.PI), Y + r * 0.8 * Math.sin((i / 12) * 2 * Math.PI)], T))); }).join(""));
  }
  draw();

  let on = false, here = false;
  const B = register(stage, (dt) => {
    const m = [stepS(ang, dt), stepS(near, dt)].some(Boolean);
    // the tails ripple and the nucleus tumbles only while the sun is about
    if (here) { clock += dt * (0.5 + 1.5 * near.x); spin += dt * 0.12; }
    draw();
    return m || here;
  });
  bag.add(B.unregister);

  function point(q) {
    here = !!q;
    if (q) {
      const dx = q[0] - CX, dy = q[1] - CY, d = Math.hypot(dx, dy);
      // the sun can't sit inside the comet: as it comes close, keep its direction and hold it at the coma's edge
      let t = Math.atan2(dy, dx); while (t - ang.t > Math.PI) t -= 2 * Math.PI; while (t - ang.t < -Math.PI) t += 2 * Math.PI;
      ang.t = t; near.t = Math.max(0, Math.min(1, 1 - (d - 40) / 200));
      read.textContent = `sun ${Math.round(Math.max(30, d))} · tail ${Math.round(Math.min((110 + 130 * near.t) * reach, room(t + Math.PI) - 24))}`;
    } else { let t = Math.atan2(-1, -1.4); while (t - ang.t > Math.PI) t -= 2 * Math.PI; while (t - ang.t < -Math.PI) t += 2 * Math.PI; ang.t = t; near.t = 0.4; read.textContent = "rest"; }
    const n = !!q && near.t > 0.5;
    if (n !== on) { on = n; face.classList.toggle("hi", n); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "comet",
  means: "A comet: the pointer is the sun, and its two tails swing to point away from it, growing longer and livelier the nearer it comes.",
  rules: [1, 3, 7, 8],
  range: [0.6, 0.8, 1],
  mount,
});
