/**
 * Hedgehog: a hedgehog curled low on the ground, its spines lying back along
 * its dome, its snout out and its nose the one bright mark. The pointer is
 * read on a plane through the dome; spines near it bristle, standing up along
 * their normals and growing, each on its own spring, falling off with
 * distance. The bristled spines take the bright stroke. The read-out counts
 * them. The slider is the radius, in world units.
 *
 * Spines are lines from the dome's surface. Those on the far half are painted
 * before the dome, so it hides their roots and only their tips show over it;
 * those on the near half after it. The hit test is a fixed plane.
 */
const {
  Cam, fit, hull, lerp, mk, open, place, pointer, poly, proj, register, seg, spring, stepS, unproj, disposer,
} = HL;

const A = 24, B = 17, H = 15, Z0 = 1.5, PZ = 9;
const EYE = [0.612, 0.612, 0.5];
// rings of spines: elevation in degrees, and how many round
const ROWS = [[8, 26], [24, 24], [40, 20], [56, 15], [71, 9], [84, 3]];

/** The share of full bristle at u radii from the pointer: 1 → .65 at half → 0 at the edge. */
const falloff = (u) => (u <= 0.5 ? 1 - (u / 0.5) * 0.35 : u <= 1 ? 0.65 * (1 - (u - 0.5) / 0.5) : 0);
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, over = null;

  const C = Cam(45, 0.5, 4.2);
  fit(C, [[-B - 10, -A - 6, 0], [B + 10, A + 9, 0], [B + 10, -A - 6, 0], [-B - 10, A + 9, 0], [0, -4, H + Z0 + 12]], 200, 166);
  const P = proj(C);

  // spines: a root on the dome, its normal, and the direction it lies at rest, back along the body
  const spines = [];
  for (const [el, n] of ROWS) for (let k = 0; k < n; k++) {
    const f = (el * Math.PI) / 180, t = ((k + (el % 16 ? 0.5 : 0)) / n) * 2 * Math.PI;
    const root = [B * Math.cos(f) * Math.cos(t), A * Math.cos(f) * Math.sin(t) - 2, Z0 + H * Math.sin(f)];
    if (root[1] > A * 0.62 && f < 1.1) continue; // the face is bare
    const nrm = norm([Math.cos(f) * Math.cos(t) / B, Math.cos(f) * Math.sin(t) / A, Math.sin(f) / H]);
    const lie = norm([nrm[0] * 0.4, nrm[1] * 0.4 - 1, nrm[2] * 0.4 + 0.12]);
    const near = nrm[0] * EYE[0] + nrm[1] * EYE[1] + nrm[2] * EYE[2] > -0.05;
    spines.push({ root, nrm, lie, near, sp: spring(0, { eps: 0.004 }) });
  }

  const g = mk("g", {}, svg);
  const backSp = mk("path", { class: "nf lo" }, g);
  const ell = (c, r) => { const o = []; for (let i = 0; i <= 8; i++) for (let j = 0; j < 16; j++) { const t = (i / 8) * Math.PI, f = (j / 16) * 2 * Math.PI; o.push(P(c[0] + r[0] * Math.sin(t) * Math.cos(f), c[1] + r[1] * Math.sin(t) * Math.sin(f), c[2] + r[2] * Math.cos(t))); } return o; };
  // the dome: the hull of its rings, low to high
  const dome = [];
  for (let k = 0; k <= 8; k++) {
    const f = (k / 8) * (Math.PI / 2) * 0.98;
    for (let j = 0; j < 48; j++) { const t = (j / 48) * 2 * Math.PI; dome.push(P(B * Math.cos(f) * Math.cos(t), A * Math.cos(f) * Math.sin(t) - 2, Z0 + H * Math.sin(f))); }
  }
  mk("path", { d: poly(hull(dome)), class: "sil" }, g);
  // the belly's edge, a crease just over the ground on the near side
  mk("path", { d: open(Array.from({ length: 25 }, (_, j) => { const t = -Math.PI * 0.25 + (j / 24) * Math.PI; return P(B * 0.99 * Math.cos(t), A * 0.99 * Math.sin(t) - 2, Z0 + 1.2); })), class: "nf lo" }, g);
  // the head: a round face drawn out to a pointed snout, a round ear, an eye, a wet nose
  const HY = A * 0.66;
  mk("path", { d: poly(hull(ell([0, HY, 6.6], [6.4, 6.8, 5.8]).concat(ell([0, HY + 6, 5.2], [3.4, 3, 3]), ell([0, A + 7.6, 4.2], [1.3, 1.3, 1.2])))), class: "sil" }, g);
  mk("path", { d: open([-1, -0.5, 0, 0.5, 1].map((t) => P(t * 1.8, A + 5.6 + (1 - t * t) * 0.6, 2.5 - (1 - t * t) * 0.4))), class: "nf lo" }, g);
  const ear = Array.from({ length: 16 }, (_, k) => { const t = (k / 16) * 2 * Math.PI; return P(4.6 + 1.5 * Math.cos(t), HY - 2.6 - 1.5 * Math.cos(t), 10.4 + 2 * Math.sin(t)); });
  mk("path", { d: poly(ear), class: "" }, g);
  mk("path", { d: poly(ear.map((p, k) => { const c = ear.reduce((a, q) => [a[0] + q[0] / ear.length, a[1] + q[1] / ear.length], [0, 0]); return [c[0] + (p[0] - c[0]) * 0.5, c[1] + (p[1] - c[1]) * 0.5]; })), class: "nf lo" }, g);
  const eye = mk("circle", { r: 1.5, class: "dot m" }, g);
  place(eye, P(4.2, HY + 4, 8.2));
  const nose = mk("circle", { r: 1.7, class: "dot" }, g);
  place(nose, P(0, A + 8.8, 4.4));
  const foreSp = mk("path", { class: "nf" }, g), hiSp = mk("path", { class: "nf hi" }, g);
  // two small feet peeping out under the skirt of spines on the near side
  for (const [x, y] of [[13.6, -9], [12, 9.5]]) {
    mk("path", { d: poly(hull(ell([x, y, 1.1], [2.2, 3, 1.2]))), class: "" }, g);
    mk("path", { d: [-0.8, 0.8].map((o) => open([P(x + o, y + 2, 0.5), P(x + o, y + 2.6, 1.6)])).join(""), class: "nf lo" }, g);
  }

  let drawn = "";
  function draw() {
    const key = spines.map((s) => s.sp.x.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    let back = "", fore = "", hi = "";
    for (const s of spines) {
      const b = s.sp.x, d = norm(s.lie.map((v, i) => lerp(v, s.nrm[i], b))), L = lerp(5.5, 12, b);
      const tip = s.root.map((v, i) => v + d[i] * L), base = s.root.map((v, i) => v - d[i] * 0.6);
      const sg = seg(P(...base), P(...tip));
      if (!s.near) back += sg; else if (b > 0.5) hi += sg; else fore += sg;
    }
    backSp.setAttribute("d", back); foreSp.setAttribute("d", fore); hiSp.setAttribute("d", hi);
  }
  draw();

  const Bk = register(stage, (dt) => { let m = false; for (const s of spines) if (stepS(s.sp, dt)) m = true; draw(); return m; });
  bag.add(Bk.unregister);

  function retarget() {
    let up = 0;
    for (const s of spines) {
      s.sp.t = over ? falloff(Math.hypot(s.root[0] - over[0], s.root[1] - over[1]) / R) : 0;
      if (s.sp.t > 0.5) up++;
    }
    nose.setAttribute("class", over && up ? "dot m" : "dot");
    read.textContent = over && up ? `spines ${up}` : "rest";
    Bk.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { const w = unproj(C, p[0], p[1], PZ); over = Math.hypot(w[0] / (B + R), (w[1] + 2) / (A + R)) < 1.4 ? w : null; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "hedgehog",
  means: "A hedgehog low on the ground: its spines bristle where the pointer comes near, the nearest standing tallest.",
  rules: [1, 3, 5, 6],
  range: [12, 18, 26],
  mount,
});
