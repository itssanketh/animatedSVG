/**
 * Keyboard: a sixty percent mechanical keyboard, as in the photograph: a low case and in it sixty-one keycaps in five
 * staggered rows, the wide ones where they belong (tab, caps lock, the shifts, enter, backspace and the long space bar),
 * every cap a sculpted cap, its skirt sloping in from its foot to a smaller top set back a little. Move the pointer over
 * it and the keys sink: the key under the pointer goes down furthest and its neighbours follow it down, less the
 * further they are, so a soft dent runs under the pointer as it moves; leave and they all spring back up level. The key
 * under the pointer takes the bright edge. The read-out names it; the slider is how wide the patch that sinks is.
 *
 * The case is a rounded block, a silhouette and the crease of its rim; each cap is the hull of its foot and its top,
 * with its top as the crease, painted far to near. The pointer is read on the plane of the keys' tops, and the hit test
 * is each key's footprint at rest.
 */
const { Cam, clamp, facing, fit, hull, mk, poly, prism, proj, put, rings, spring, stepS, unproj, disposer, pointer, register, solid } = HL;

const U = 4, GAP = 0.22, FOOT = 1.6, CAP = 2.6, TRAVEL = 2.1, CASE = 2.4;
const LAYOUT = [
  "Esc 1 2 3 4 5 6 7 8 9 0 - = Backspace:2",
  "Tab:1.5 Q W E R T Y U I O P [ ] \\:1.5",
  "Caps:1.75 A S D F G H J K L ; ' Enter:2.25",
  "Shift:2.25 Z X C V B N M , . / Shift:2.75",
  "Ctrl:1.25 Win:1.25 Alt:1.25 Space:6.25 Alt:1.25 Win:1.25 Menu:1.25 Ctrl:1.25",
];
const KEYS = LAYOUT.flatMap((row, r) => {
  let x = 0;
  return row.split(" ").map((t) => { const [name, w = "1"] = t.split(":"), k = { name, x0: x * U, x1: (x + +w) * U, y0: r * U, y1: (r + 1) * U }; x += +w; return k; });
}).map((k) => ({ ...k, x0: k.x0 - 7.5 * U, x1: k.x1 - 7.5 * U, y0: k.y0 - 2.5 * U, y1: k.y1 - 2.5 * U }));

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const C = Cam(45, 0.5, 5.2);
  const X0 = -7.5 * U - 1.2, X1 = 7.5 * U + 1.2, Y0 = -2.5 * U - 1.2, Y1 = 2.5 * U + 1.2;
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X0, Y1, 0], [X1, Y0, 0], [X0, Y1, FOOT + CAP], [X1, Y0, FOOT + CAP]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const box = solid(g);
  put(box, prism(P, front, ...rings(X0, Y0, X1, Y1, 1.8, 0.9), 0, CASE));

  // far to near: row by row toward you, and along each row left to right
  const keys = KEYS.map((k) => ({ ...k, sp: spring(0, { k: 220, c: 16, eps: 0.002 }) })).sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  for (const k of keys) {
    k.s = solid(g);
    k.foot = rings(k.x0 + GAP, k.y0 + GAP, k.x1 - GAP, k.y1 - GAP, 0.5, 0)[0];
    // the top: inset from the foot, a little more at the front so the cap leans back like a sculpted keycap
    k.top = rings(k.x0 + 0.75, k.y0 + 0.55, k.x1 - 0.75, k.y1 - 1.05, 0.7, 0)[0];
  }
  function draw() {
    for (const k of keys) {
      const z = FOOT + CAP - k.sp.x, foot = k.foot.map((q) => P(q.u, q.v, FOOT)), top = k.top.map((q) => P(q.u, q.v, z));
      k.s.sil.setAttribute("d", poly(hull([...foot, ...top])));
      k.s.cr.setAttribute("d", poly(top));
    }
  }
  draw();

  const B = register(stage, (dt) => { let m = false; for (const k of keys) if (stepS(k.sp, dt)) m = true; draw(); return m; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    let hit = null;
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], FOOT + CAP);
      hit = keys.find((k) => x >= k.x0 && x < k.x1 && y >= k.y0 && y < k.y1) || null;
      const on = x > X0 && x < X1 && y > Y0 && y < Y1;
      // every key sinks by how near its nearest edge is to the pointer, out to reach keys away
      for (const k of keys) {
        const dx = Math.max(k.x0 + GAP - x, 0, x - k.x1 + GAP), dy = Math.max(k.y0 + GAP - y, 0, y - k.y1 + GAP), f = clamp(1 - Math.hypot(dx, dy) / (reach * U), 0, 1);
        k.sp.t = on ? TRAVEL * f * f * (3 - 2 * f) : 0;
      }
    } else for (const k of keys) k.sp.t = 0;
    if (hit !== lit) { if (lit) lit.s.sil.classList.remove("hi"); lit = hit; if (hit) hit.s.sil.classList.add("hi"); }
    read.textContent = hit ? hit.name : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "keyboard",
  means: "A 60% keyboard: the key under the pointer sinks and its neighbours follow it down, less the further away; leave and they rise.",
  rules: [1, 2, 7, 9],
  range: [1.2, 2, 3],
  mount,
});
