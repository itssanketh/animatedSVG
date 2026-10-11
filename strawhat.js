/**
 * Straw hat: Luffy's straw hat from One Piece, lying on the ground: a wide brim, a round crown, the band round the base
 * of the crown and the chin string looped beneath. Bring the pointer near and the wind catches it, the way the hat is
 * always being carried off: it lifts off the ground and drifts toward the pointer, tilting and turning as it goes, its
 * string streaming out behind it and wind lines rushing past, its shadow left on the ground below; leave and the wind
 * drops and it floats back down to rest. The brim takes the bright edge while it flies. The read-out says where the
 * wind is carrying it; the slider is how strong the wind is.
 *
 * The brim is the hull of its two faces with a ring of weave on top; the crown is the hull of rings up a domed profile,
 * the band the near halves of two rings round it; the string is a curve; the wind lines are short strokes behind the
 * hat, the flowing-cloth and running-line techniques of anime motion drawing. The hit test is the hat at rest.
 */
const { Cam, clamp, fit, hull, lerp, mk, open, poly, proj, rad, spring, stepS, unproj, reducedMotion, disposer, pointer, register } = HL;

const BRIM = 15, CROWN = 7.2, TALL = 9;
const add = (a, b, k = 1) => a.map((x, i) => x + b[i] * k), sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let wind = value;
  const C = Cam(45, 0.5, 6.6);
  fit(C, [[-24, -24, 0], [24, 24, 0], [24, -24, 0], [-24, 24, 0], [0, 0, 26]], 200, 165);
  const P = proj(C), g = mk("g", {}, svg), pts = (ws) => ws.map((q) => P(...q)), eye = [0.612, 0.612, 0.5];
  const el = (cls) => mk("path", { class: cls }, g);
  const shadow = el("nf lo"), lines = el("nf"), string = el("nf"), brim = el("sil"), weave = el("nf lo"), crown = el("sil"), band = el("nf");

  const fly = spring(0, { k: 12, c: 6, eps: 0.002 }), dx = spring(0, { k: 10, c: 5.5, eps: 0.02 }), dy = spring(0, { k: 10, c: 5.5, eps: 0.02 });
  let dir = rad(45), clock = 0;
  function draw(dt) {
    if (fly.x > 0.01 && !reducedMotion()) clock += dt;
    const f = fly.x, lift = f * 11 * wind + 0.6 * Math.sin(clock * 2.3) * f, spin = clock * 0.9 * f;
    // the hat's frame: tipped by the wind about the axis square to its drift, a little wobble on top, then lifted and moved
    const tilt = f * rad(22) + f * rad(5) * Math.sin(clock * 3.1), ax = [-Math.sin(dir), Math.cos(dir), 0];
    const rot = (p) => { const c = Math.cos(tilt), s = Math.sin(tilt), k = ax, d = dot(k, p), cr = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]]; return [0, 1, 2].map((i) => p[i] * c + cr[i] * s + k[i] * d * (1 - c)); };
    const at = (r, a, w) => add(rot([r * Math.cos(a + spin), r * Math.sin(a + spin), w]), [dx.x, dy.x, 0.4 + lift]);
    const ring = (r, w, n = 48) => Array.from({ length: n }, (_, k) => at(r, (k / n) * 2 * Math.PI, w));
    const c0 = at(0, 0, 0);
    // the shadow left on the ground, smaller and fainter the higher the hat goes
    const sr = BRIM * (1 - 0.35 * f);
    shadow.setAttribute("d", f > 0.05 ? poly(pts(Array.from({ length: 40 }, (_, k) => [dx.x + sr * Math.cos((k / 40) * 2 * Math.PI), dy.x + sr * Math.sin((k / 40) * 2 * Math.PI), 0]))) : "");
    brim.setAttribute("d", poly(hull(pts([...ring(BRIM, 0), ...ring(BRIM, 0.7)]))));
    weave.setAttribute("d", poly(pts(ring(BRIM - 3.4, 0.72, 56))) + poly(pts(ring(BRIM - 6.6, 0.72, 56))));
    // the crown: straight up a little, then domed over
    const prof = [[CROWN, 0.7], [CROWN, 2.8], ...Array.from({ length: 8 }, (_, k) => { const t = ((k + 1) / 8) * (Math.PI / 2); return [CROWN * Math.cos(t) + 0.2, 2.8 + (TALL - 2.8) * Math.sin(t)]; })];
    crown.setAttribute("d", poly(hull(pts(prof.flatMap(([r, w]) => ring(r, w, 32))))));
    // the band: the near halves of two rings round the crown's base
    const near = (r, w) => { const rs = ring(r, w, 48), vis = rs.map((q) => dot(sub(q, at(0, 0, w)), eye) > 0), k = vis.findIndex((v, i) => v && !vis[(i + rs.length - 1) % rs.length]); return k < 0 ? "" : open(pts(Array.from({ length: rs.length }, (_, i) => rs[(k + i) % rs.length]).filter((_, i) => vis[(k + i) % rs.length]))); };
    band.setAttribute("d", near(CROWN + 0.05, 1.1) + near(CROWN + 0.05, 2.6));
    // the chin string: from one side of the crown's base to the other, hanging under the brim, streaming back in the wind
    const back = [-Math.cos(dir), -Math.sin(dir), 0], sA = at(CROWN - 0.4, rad(90), 0.3), sB = at(CROWN - 0.4, rad(-90), 0.3);
    string.setAttribute("d", open(pts(Array.from({ length: 21 }, (_, i) => { const s = i / 20, bow = Math.sin(Math.PI * s); return add(add(add(add(sA, sub(sB, sA), s), [0, 0, -bow * lerp(1.2, 5, f)]), back, bow * f * 15), [0, 0, Math.sin(clock * 9 + s * 7) * bow * f * 1.4]); }))));
    // wind lines: short strokes rushing past behind the hat, longer the stronger it blows
    lines.setAttribute("d", f < 0.05 ? "" : [0, 1, 2, 3, 4].map((k) => { const side = (k - 2) * 4.2, run = ((clock * 22 + k * 5) % 9), o = add(add(c0, back, BRIM - 1 + run), [-back[1] * side, back[0] * side, (k % 2) * 3 - 1]); return open(pts([o, add(o, back, (3 + 4 * wind) * f)])); }).join(""));
    void c0;
  }
  draw(0);
  const restPoly = brim.getAttribute("d").match(/-?\d*\.?\d+/g).map(Number).reduce((o, v, i, a) => (i % 2 ? o : o.concat([[v, a[i + 1]]])), []);
  const inPoly = (q, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > q[1]) !== (p[j][1] > q[1]) && q[0] < ((p[j][0] - p[i][0]) * (q[1] - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };

  const B = register(stage, (dt) => { const m = [stepS(fly, dt), stepS(dx, dt), stepS(dy, dt)].some(Boolean); draw(dt); return m || fly.x > 0.01; });
  bag.add(B.unregister);

  function point(q) {
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], 0), d = Math.hypot(x, y);
      dir = Math.atan2(y, x); fly.t = 1;
      const go = clamp(d, 0, 6 * wind); dx.t = Math.cos(dir) * go; dy.t = Math.sin(dir) * go;
      read.textContent = `caught by the wind · drifting ${DIRS[(Math.round(dir / (Math.PI / 4)) + 8) % 8]}`;
    } else { fly.t = 0; dx.t = 0; dy.t = 0; read.textContent = "rest"; }
    brim.classList.toggle("hi", !!q && (fly.t > 0 || inPoly(q, restPoly)));
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { wind = v; }, destroy: bag.dispose };
}

hairline({
  name: "strawhat",
  means: "Luffy's straw hat: bring the pointer near and the wind lifts it, string streaming, drifting toward you; leave and it floats back down.",
  rules: [1, 3, 7, 8],
  range: [0.5, 0.8, 1],
  mount,
});
