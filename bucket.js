/**
 * Bucket: a token bucket. A tapered glass pail holds a stack of
 * coins; a tap above it holds the next coin, ready to drop. The pointer's
 * height is the demand: the lower it is, the harder requests pull, and coins
 * past what the refill can cover are lifted out over the rim and laid in a
 * fan on the ground, staggered out from the stack's new top. The slider is
 * the refill rate, in tokens per second.
 *
 * The pattern: discrete items. Tweens, a stagger by distance, a hit test on
 * the pointer's screen height alone, which nothing in the drawing can move.
 */
const {
  Cam, circ, clamp, facing, fit, hull, lerp, open, poly, prism, proj, ringAt, rings, run, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const CAP = 10, CR = 11, CT = 3.4, PITCH = 4, FLOOR = 1.5;
const RF = 12.5, RT = 19, BH = 50, LIFT = 57, REST = 7;
const PX = -36, AZ = 82, DZ = 67;
const disc = (R, n) => [circ(R, n), circ(R - 1.6, n)];
const at = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
const SLOT = [[6, 26], [1, 31], [-2, 37], [-7, 42], [-10, 48], [-15, 53], [-18, 59], [-23, 64], [-26, 70], [-31, 75]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.35);
  fit(C, [[-9, PX - 9, 0], [0, PX, AZ + 6], [-RT, RT, BH], [RT, -RT, BH], [-31 - CR, 75 + CR, 0], [-31 + CR, 75 + CR, 0], [6 + CR, 26, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  let rate = value, demand = null, L = REST;

  const g = mk("g", {}, svg);
  const solidAt = (ring, inner, x, y, z0, z1) => { const s = solid(g); put(s, prism(P, front, at(ring, x, y), at(inner, x, y), z0, z1)); return s; };

  // The tap's post, behind the glass.
  const [pb, pbi] = disc(8, 48), [pp, ppi] = disc(3.4, 32);
  solidAt(pb, pbi, 0, PX, 0, 3);
  solidAt(pp, ppi, 0, PX, 3, AZ);

  // The glass: its floor and the coins' path down are behind the coins; its outline and lip, in front.
  const foot = circ(RF), top = circ(RT), lip = circ(RT - 0.5);
  mk("path", { d: poly(ringAt(P, foot, FLOOR)), class: "nf lo" }, g);
  mk("path", { d: seg(P(0, 0, DZ), P(0, 0, FLOOR)), class: "dash" }, g);
  const inG = mk("g", {}, g);
  mk("path", { d: poly(hull(ringAt(P, foot, 0).concat(ringAt(P, top, BH)))), class: "sil nf" }, g);
  mk("path", { d: open(ringAt(P, run(top, front), BH)), class: "nf" }, g);
  mk("path", { d: open(ringAt(P, run(lip, front), BH - 3.5)), class: "nf lo" }, g);

  // The tap: an arm over the pail, a nozzle, and the next coin hanging under it.
  const [ar, ari] = rings(-3.4, PX - 3.4, 3.4, 3.4, 3.4, 1);
  put(solid(g), prism(P, front, ar, ari, AZ, AZ + 5));
  const [nz, nzi] = disc(3, 32);
  solidAt(nz, nzi, 0, 0, DZ + CT + 3, AZ);
  const [cr, ci] = disc(CR, 48);
  const drip = solidAt(cr, ci, 0, 0, DZ, DZ + CT);
  const outG = mk("g", {}, g);

  // Coin i sits at height i in the stack; if it is spent it lies in slot CAP-1-i, so the top coin lies nearest.
  const coins = [];
  for (let i = 0; i < CAP; i++) coins.push({ i, s: SLOT[CAP - 1 - i], tw: tween(i < REST ? 0 : 1), el: solid(inG), v: NaN, pos: null });

  /** Where coin c is at progress v: up out of the pail, over the rim, down onto its slot. */
  function where(c, v) {
    const z0 = FLOOR + c.i * PITCH, [sx, sy] = c.s;
    if (v < 0.3) return [0, 0, lerp(z0, LIFT, v / 0.3)];
    if (v < 0.65) { const h = (v - 0.3) / 0.35; return [sx * h, sy * h, LIFT]; }
    return [sx, sy, lerp(LIFT, 0, (v - 0.65) / 0.35)];
  }

  let lit = null;
  function light() {
    const want = demand === null ? drip : L > 0 ? coins[L - 1].el : drip;
    if (want === lit) return;
    if (lit) lit.sil.classList.remove("hi");
    (lit = want).sil.classList.add("hi");
  }

  // Inside the pail coins paint bottom up; outside, back to front and low to high.
  function order() {
    for (const c of coins) if (!(c.v > 0.25)) inG.append(c.el.g);
    coins.filter((c) => c.v > 0.25)
      .sort((a, b) => a.pos[0] + a.pos[1] + a.pos[2] * 2 - (b.pos[0] + b.pos[1] + b.pos[2] * 2))
      .forEach((c) => outG.append(c.el.g));
  }

  const B = register(stage, (dt, now) => {
    let moving = false, moved = false;
    for (const c of coins) {
      const v = tval(c.tw, now);
      if (!tdone(c.tw, now)) moving = true;
      if (v === c.v) continue;
      c.v = v; c.pos = where(c, v); moved = true;
      put(c.el, prism(P, front, at(cr, c.pos[0], c.pos[1]), at(ci, c.pos[0], c.pos[1]), c.pos[2], c.pos[2] + CT));
    }
    if (moved) order();
    light();
    return moving;
  });
  bag.add(B.unregister);

  function retarget() {
    const now = performance.now();
    // Demand runs 0 to 14 requests a second, top of the stage to bottom; what the refill can't cover drains the bucket.
    L = demand === null ? REST : clamp(Math.round(CAP - (demand - rate) * 2), 0, CAP);
    for (const c of coins) tset(c.tw, c.i < L ? 0 : 1, now, Math.abs(c.i - L) * 45);
    read.textContent = demand === null ? "rest" : `${L}/${CAP}`;
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { demand = clamp((p[1] - 40) / 220, 0, 1) * 14; retarget(); },
    leave: () => { demand = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { rate = v; if (demand !== null) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "bucket",
  means: "A token bucket: the lower the pointer, the harder requests pull, and coins the refill can't cover leave the pail.",
  rules: [1, 2, 5, 6],
  range: [2, 4, 7],
  mount,
});
