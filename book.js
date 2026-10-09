/**
 * Book: a hardback lying open on its back board, one leaf mid-turn. The
 * pointer thumbs through it: where it sits across the book picks a leaf, that
 * leaf stands up, the ones before it fall open to the left and the ones after
 * it settle to the right, staggered outwards from it on the 700ms curve. The
 * read-out names the leaf. The slider is the stagger, in ms.
 *
 * Every leaf turns on the one spine line, so the depth order is the angular
 * distance from the camera's edge-on angle: leaves are re-appended when it
 * changes. The hit test is a static band in screen x across the book, which no
 * leaf's pose can move.
 */
const {
  Cam, clamp, fillet, fit, open, poly, proj, rad, rings, prism, solid, put, facing,
  tset, tval, tdone, tween, disposer, mk, pointer, register,
} = HL;

const N = 9, W = 50, D = 70, OV = 4, BT = 3, TK = 2.2, CURL = 4;
const R0 = 3, FAN = 2.4, STAND = 94, AJAR = 132, REST = 4;

/** Leaf i's angle about the spine when leaf a stands; a < 0 is rest, open in the middle with one leaf mid-turn. Leaf 0 is the cover. */
function angle(i, a) {
  const t = a < 0 ? REST : a;
  return i < t ? 180 - R0 - i * FAN : i > t ? R0 + (N - 1 - i) * FAN : a < 0 ? AJAR : STAND;
}

const steps = (n, a, b) => Array.from({ length: n + 1 }, (_, j) => a + ((b - a) * j) / n);
/** Every edge of a closed outline cut into n, so a curled leaf bends along it. */
const dense = (pts, n) => pts.flatMap((p, k) => {
  const q = pts[(k + 1) % pts.length];
  return steps(n, 0, 1).slice(0, n).map((t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
});

const PAGE = dense(fillet([[0, 0], [W, 0], [W, D], [0, D]], [0.6, 3, 3, 0.6]), 6);
const COVER = fillet([[0, -OV], [W + OV, -OV], [W + OV, D + OV], [0, D + OV]], [1, 3.5, 3.5, 1]);
// lines of text, two of them ending a paragraph
const LINES = [11, 18, 25, 32, 41, 48, 55, 62].map((v, k) => [v, k === 3 || k === 7 ? W * 0.55 : W - 7]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 2.05);
  fit(C, [[-W - OV, -OV, 0], [W + OV, D + OV, 0], [W + OV, -OV, 0], [-W - OV, D + OV, 0], [0, -OV, BT + W + OV + TK], [-30, -OV, BT + 46]], 200, 166);
  const P = proj(C), front = facing(C);

  // the angle at which a leaf is seen edge-on: leaves nearer it in angle are nearer the eye
  const o = P(0, 0, 0), dv = (q) => [q[0] - o[0], q[1] - o[1]], cr = (a, b) => a[0] * b[1] - a[1] * b[0];
  const ey = dv(P(0, 1, 0));
  const PHI = (Math.atan2(Math.abs(cr(dv(P(1, 0, 0)), ey)), Math.abs(cr(dv(P(0, 0, 1)), ey))) * 180) / Math.PI;

  /** A point on a leaf at angle th: u out from the spine, v along it, off along the leaf's normal, bowed by curl. */
  function at(th, u, v, off, curl) {
    const c = Math.cos(rad(th)), s = Math.sin(rad(th));
    const h = off + curl * Math.sin(Math.PI * clamp(u / W, 0, 1)) * c;
    return P(u * c - h * s, v, BT + u * s + h * c);
  }

  const g = mk("g", {}, svg);
  // the back board and spine, which never move
  const [ring, inner] = rings(-6, -OV, W + OV, D + OV, 3.5, 1.4);
  put(solid(g), prism(P, front, ring, inner, 0, BT));

  const lg = mk("g", {}, g);
  const leaves = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, lg);
    const far = i === 0 ? mk("path", { class: "lo" }, grp) : null;
    const near = mk("path", { class: "sil" }, grp);
    const text = mk("path", { class: "nf lo" }, grp);
    leaves.push({ g: grp, far, near, text, cover: i === 0, th: NaN, tw: tween(angle(i, -1)) });
  }

  function draw(lf, th) {
    if (th === lf.th) return;
    lf.th = th;
    if (lf.cover) {
      // the board's two faces: the one turned to the eye is drawn last, with the joint groove on it
      const up = Math.sin(rad(PHI - th)) > 0, nOff = up ? 0 : -TK, fOff = up ? -TK : 0;
      lf.far.setAttribute("d", poly(COVER.map(([u, v]) => at(th, u, v, fOff, 0))));
      lf.near.setAttribute("d", poly(COVER.map(([u, v]) => at(th, u, v, nOff, 0))));
      lf.text.setAttribute("d", open([at(th, 5, -OV + 2, nOff, 0), at(th, 5, D + OV - 2, nOff, 0)]));
      return;
    }
    lf.near.setAttribute("d", poly(PAGE.map(([u, v]) => at(th, u, v, 0, CURL))));
    lf.text.setAttribute("d", LINES.map(([v, u1]) => open(steps(6, 7, u1).map((u) => at(th, u, v, 0, CURL)))).join(""));
  }

  let order = "";
  const B = register(stage, (_dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */
    let moving = false;
    for (const lf of leaves) { draw(lf, tval(lf.tw, now)); if (!tdone(lf.tw, now)) moving = true; }
    // far from the edge-on angle first
    const idx = leaves.map((_, i) => i).sort((a, b) => Math.abs(leaves[b].th - PHI) - Math.abs(leaves[a].th - PHI));
    const key = idx.join();
    if (key !== order) { order = key; for (const i of idx) lg.appendChild(leaves[i].g); }
    return moving;
  });
  bag.add(B.unregister);

  // hit band: screen x across the resting book, from its right edge (the cover) to its left (the last leaf)
  const xr = P(W + OV, D / 2, 0)[0], xl = P(-W - OV, D / 2, 0)[0];
  const top = P(0, -OV, BT + W + OV)[1] - 8, bot = P(W + OV, D + OV, 0)[1] + 8;
  function hit([x, y]) {
    const s = (xr - x) / (xr - xl);
    if (y < top || y > bot || s < -0.08 || s > 1.08) return -1;
    return clamp(Math.round(s * (N - 1)), 0, N - 1);
  }

  let act = -2;
  const caption = (a) => (a < 0 ? "rest" : a === 0 ? "cover" : "p " + String(2 * a - 1).padStart(2, "0"));
  /** Stands leaf a up (-1 lets the book fall back to rest), staggered out from it or from the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : REST;
    act = a;
    leaves.forEach((lf, i) => {
      tset(lf.tw, angle(i, a), now, Math.abs(i - from) * stag);
      lf.near.classList.toggle("hi", i === (a < 0 ? REST : a));
    });
    read.textContent = caption(a);
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "book",
  means: "A hardback on a desk: the pointer thumbs through it, the leaf under it stands and the rest fall open in turn.",
  rules: [1, 2, 6, 8],
  range: [0, 40, 90],
  mount,
});
