/**
 * Tetris: a well of blocks with a T piece waiting above it, as the game stands. Bring the pointer over the well and the piece
 * steps across to the column under it and falls, a row at a time as the game's piece does, until it lands and locks. Over the
 * right gap its stem fills the hole in the second row, and the line it completes flashes; anywhere else it simply locks on top.
 * The locked piece, or the line, takes the bright edge, and the read-out says which. Leave and the piece goes back up to wait.
 * The slider is how fast it falls, in rows a second.
 *
 * Every block is a prism of a rounded square, one unit across, standing in a well one block deep; they are painted from the far
 * corner to the near one. The column is chosen from the blocks' resting screen positions, which never move.
 */
const { Cam, fit, proj, facing, rings, prism, solid, put, tween, tset, tval, tdone, mk, register, pointer, disposer } = HL;

const COLS = 8, SPAWN = 6, WALL = 7.4, PIECE = [[0, 1], [1, 1], [2, 1], [1, 0]];
// the stack, row by row from the floor: high at the walls, low in the middle, the bottom row missing one block at column 4
const STACK = [[0, 0], [1, 0], [2, 0], [3, 0], [5, 0], [6, 0], [7, 0], [0, 1], [1, 1], [6, 1], [7, 1], [0, 2], [7, 2]];
const filled = new Set(STACK.map(([c, r]) => c + "," + r));
const top = (c) => Math.max(-1, ...STACK.filter((s) => s[0] === c).map((s) => s[1]));
/** The row the piece's lowest cells come to rest on, dropped with its left edge at column c. */
const land = (c) => Math.max(...PIECE.map(([dc, dr]) => top(c + dc) + 1 - dr));

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let speed = value;
  // turned so the well faces you, as the game is played; a little off square so the blocks keep their depth
  const C = Cam(18, 0.5, 26);
  fit(C, [[-0.6, -0.6, -0.6], [COLS + 0.6, 1.6, -0.6], [-0.6, 1.6, -0.6], [COLS + 0.6, -0.6, SPAWN + 2.2]], 200, 166);
  const P = proj(C), front = facing(C), [ring0, inner0] = rings(0.04, 0.04, 0.96, 0.96, 0.14, 0.12);
  const cube = (c, y, z, s) => put(s, prism(P, front, ring0.map((q) => ({ ...q, u: q.u + c, v: q.v + y })), inner0.map((q) => ({ ...q, u: q.u + c, v: q.v + y })), z, z + 0.92));

  const g = mk("g", {}, svg);
  // the well: its floor and the far wall's foot first; its near wall is painted after the blocks
  const [fr, fi] = rings(-0.7, -0.5, COLS + 0.7, 1.5, 0.4, 0.3), [lw, lwi] = rings(-0.62, 0, -0.12, 1, 0.2, 0.12), [rw, rwi] = rings(COLS + 0.12, 0, COLS + 0.62, 1, 0.2, 0.12);
  put(solid(g), prism(P, front, fr, fi, -0.5, 0));
  put(solid(g), prism(P, front, lw, lwi, 0, WALL));
  // stack and piece blocks, in one list so they paint far to near: by column, then height
  const stack = STACK.map(([c, r]) => ({ c, r, s: null }));
  const piece = PIECE.map(([dc, dr]) => ({ dc, dr, s: null }));
  const order = [...stack, ...piece];
  order.forEach((b) => { b.s = solid(g); });
  const near = solid(g); put(near, prism(P, front, rw, rwi, 0, WALL));

  let col = 2, row = SPAWN, fall = 0, on = false, locked = false;
  let up = tween(SPAWN); // the piece's row while it goes back up to wait, after the pointer has left
  function draw(now) {
    const pr = on ? row : tval(up, now);
    const items = [...stack.map((b) => ({ b, c: b.c, z: b.r })), ...piece.map((b) => ({ b, c: col + b.dc, z: pr + b.dr }))].sort((x, y) => x.c - y.c || x.z - y.z);
    items.forEach((it, k) => { cube(it.c, 0, it.z, it.b.s); if (g.children[k + 2] !== it.b.s.g) g.insertBefore(it.b.s.g, g.children[k + 2] || null); });
  }
  draw(performance.now());

  function lockNow() {
    locked = true;
    // the line: a row the piece completes
    const cells = new Set([...filled, ...piece.map((b) => col + b.dc + "," + (row + b.dr))]);
    const line = [0, 1, 2, 3].find((r) => Array.from({ length: COLS }, (_, c) => cells.has(c + "," + r)).every(Boolean));
    const lit = (b, rr) => line !== undefined && rr === line;
    stack.forEach((b) => b.s.sil.classList.toggle("hi", lit(b, b.r)));
    piece.forEach((b) => b.s.sil.classList.toggle("hi", line === undefined || row + b.dr === line));
    read.textContent = line !== undefined ? "line clear" : "locked";
  }
  const B = register(stage, (dt, now) => {
    let m = !tdone(up, now);
    if (on && !locked) {
      // the game's gravity: one whole row at a time
      fall += dt * speed;
      while (fall >= 1 && !locked) { fall -= 1; if (row > land(col)) row -= 1; if (row <= land(col)) lockNow(); }
      m = true;
    }
    draw(now);
    return m;
  });
  bag.add(B.unregister);

  // the columns' resting screen positions, for picking the column under the pointer
  const colX = Array.from({ length: COLS - 2 }, (_, c) => P(c + 1.5, 0.5, 2)[0]);
  function point(q) {
    const now = performance.now(), near = !!q && q[0] > colX[0] - 40 && q[0] < colX[colX.length - 1] + 40 && q[1] > 30 && q[1] < 300;
    if (near) {
      const c = colX.reduce((b, x, i) => (Math.abs(x - q[0]) < Math.abs(colX[b] - q[0]) ? i : b), 0);
      if (!on) { on = true; locked = false; row = SPAWN; fall = 0; }
      // it steps across only where it fits at the height it has fallen to
      if (!locked && c !== col && row >= land(c)) col = c;
      if (!locked) read.textContent = "column " + (col + 2);
    } else if (on) {
      // the piece goes back up to its spawn row
      on = false; locked = false; up = tween(row); tset(up, SPAWN, now, 0); row = SPAWN;
      [...stack, ...piece].forEach((b) => b.s.sil.classList.remove("hi"));
      read.textContent = "rest";
    }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { speed = v; }, destroy: bag.dispose };
}

hairline({
  name: "tetris",
  means: "A Tetris well: the T piece steps to the column under the pointer and falls a row at a time until it locks, completing a line.",
  rules: [1, 6, 8, 9, 10],
  range: [6, 10, 16],
  mount,
});
