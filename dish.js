/**
 * Dish: a satellite dish on its mount, a round base, a post and a yoke, the dish a shallow bowl with a feed horn held at
 * its focus on three struts. At rest it is stowed, its bowl turned up to the sky. Bring the pointer near and it tracks
 * it: the dish turns on its post and tips its bowl to face the pointer, and while it is locked on, rings of signal pulse
 * out of the feed toward it; leave and the signal stops and the dish swings back up to its stow. The part under the
 * pointer takes the bright edge. The read-out gives its bearing and elevation; the slider is how far the signal reaches.
 *
 * Base and post are short cylinders; the bowl is the hull of its rim and its vertex, its inside shown by the rim and one
 * ring when it faces you; the struts are lines and the feed a ring; the signal is arcs of rings square to the dish's
 * axis. The bowl and its feed are painted in the order they face. The pointer is read on the ground's plane for the
 * bearing and by its height on screen for the elevation, and the hit test is the dish at rest.
 */
const { Cam, circ, clamp, facing, fit, hull, lerp, mk, open, poly, prism, proj, put, rad, spring, stepS, unproj, reducedMotion, disposer, pointer, register, solid } = HL;

const POST = 13, RIM = 11, DEPTH = 3.4, FOCUS = 9.5, STOW = { yaw: rad(-45), el: rad(80) };
const add = (a, b, k = 1) => a.map((x, i) => x + b[i] * k);
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const C = Cam(45, 0.5, 8);
  fit(C, [[-14, -14, 0], [14, 14, 0], [14, -14, 0], [-14, 14, 0], [0, 0, POST + 16]], 200, 165);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), pts = (ws) => ws.map((q) => P(...q));
  const eye = norm([0.612, 0.612, 0.5]);
  const base = solid(g), post = solid(g);
  put(base, prism(P, front, circ(7, 40), circ(6, 40), 0, 1.6));
  put(post, prism(P, front, circ(1.4, 24), circ(1.1, 24), 1.6, POST));
  const el = (cls) => mk("path", { class: cls }, g);
  const yoke = el("sil"), backFeed = el("nf"), bowl = el("sil"), inside = el("nf"), frontFeed = el("nf"), horn = el("sil"), signal = el("nf");

  const yaw = spring(STOW.yaw, { k: 40, c: 12, eps: 0.002 }), elev = spring(STOW.el, { k: 40, c: 12, eps: 0.002 }), lock = spring(0, { k: 20, c: 9, eps: 0.002 });
  let clock = 0;
  const ring = (c, d, r, n = 40) => {
    const z = norm(d), U = norm(cross(Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], z)), V = cross(z, U);
    return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return add(add(c, U, r * Math.cos(t)), V, r * Math.sin(t)); });
  };
  function draw(dt) {
    const a = [Math.cos(elev.x) * Math.cos(yaw.x), Math.cos(elev.x) * Math.sin(yaw.x), Math.sin(elev.x)];
    const hub = [0, 0, POST + 1.6], v = add(hub, a, 1.2), rimC = add(v, a, DEPTH), f = add(v, a, FOCUS);
    // the yoke: a short arm from the post's top up to the back of the bowl
    yoke.setAttribute("d", poly(hull([...pts(ring([0, 0, POST], [0, 0, 1], 1.6, 16)), ...pts(ring(hub, a, 1.4, 16)), ...pts(ring(v, a, 1.8, 16))])));
    const rim = ring(rimC, a, RIM, 56), facesYou = dot(a, eye) > 0;
    bowl.setAttribute("d", poly(hull([...pts(rim), ...pts(ring(v, a, 1.6, 16))])));
    inside.setAttribute("d", facesYou ? poly(pts(rim)) + poly(pts(ring(add(v, a, DEPTH * 0.45), a, RIM * 0.62, 48))) : "");
    // the feed: three struts from the rim to a horn at the focus
    const struts = [0, 1, 2].map((k) => open(pts([rim[Math.round((k * 56) / 3 + 7) % 56], f]))).join("");
    frontFeed.setAttribute("d", facesYou ? struts : ""); backFeed.setAttribute("d", facesYou ? "" : struts);
    horn.setAttribute("d", poly(hull([...pts(ring(add(f, a, -1.2), a, 0.7, 16)), ...pts(ring(f, a, 1.3, 16))])));
    // the signal: rings square to the axis, pulsing out from the feed while it is locked on
    if (lock.x > 0.05) {
      if (!reducedMotion()) clock += dt;
      signal.setAttribute("d", [0, 1, 2].map((k) => { const s = ((clock * 0.9 + k / 3) % 1), c = add(f, a, 2 + s * reach), r = 1.5 + s * reach * 0.45, arc = ring(c, a, r, 40); return s < lock.x ? poly(pts(arc)) : ""; }).join(""));
    } else signal.setAttribute("d", "");
    // the bowl and its horn: whichever is nearer you painted last
    if (facesYou) g.append(frontFeed, horn, signal); else { g.insertBefore(horn, bowl); g.insertBefore(backFeed, horn); g.append(signal); }
  }
  draw(0);
  const rest = [["dish", bowl], ["feed", horn], ["mount", yoke], ["post", post.sil], ["base", base.sil]].map(([name, e]) => ({ name, e, ls: loops(e.getAttribute("d")) }));

  const B = register(stage, (dt) => { const m = [stepS(yaw, dt), stepS(elev, dt), stepS(lock, dt)].some(Boolean); draw(dt); return m || lock.x > 0.05; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], 0), b = Math.atan2(y, x), hub = P(0, 0, POST + 1.6);
      yaw.t = yaw.x + Math.atan2(Math.sin(b - yaw.x), Math.cos(b - yaw.x));
      // higher on screen than the dish is higher in the sky
      elev.t = rad(lerp(15, 72, clamp((hub[1] + 40 - q[1]) / 150, 0, 1)));
      lock.t = 1;
      const deg = Math.round(((b * 180) / Math.PI + 360) % 360);
      read.textContent = `tracking · bearing ${deg}° · elevation ${Math.round((elev.t * 180) / Math.PI)}°`;
    } else { yaw.t = yaw.x + Math.atan2(Math.sin(STOW.yaw - yaw.x), Math.cos(STOW.yaw - yaw.x)); elev.t = STOW.el; lock.t = 0; read.textContent = "rest"; }
    const h = q ? rest.find((p) => inLoops(q, p.ls)) : null, e = h ? h.e : null;
    if (e !== lit) { if (lit) lit.classList.remove("hi"); lit = e; if (e) e.classList.add("hi"); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "dish",
  means: "A satellite dish: bring the pointer near and it turns and tips to face it, signal pulsing from its feed; leave and it stows, facing up.",
  rules: [1, 3, 7, 8],
  range: [5, 8, 11],
  mount,
});
