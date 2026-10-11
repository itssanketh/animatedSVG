/**
 * GPU: a three-fan graphics card standing on its edge, fans toward you, as cards are pictured: the shroud with its chamfered far
 * end, three fans each in its own round opening with eleven curved blades and a hub cap, the ribbed shroud between them, the fin
 * stack showing along the top edge, the backplate behind, the metal bracket at the left with its tab and its fork, and the gold
 * fingers of the slot connector under the board with their key notch. Every edge is measured from a straight-on product photo, and
 * the card is drawn with its depth going back and up to the right, as in a three-quarter shot. At rest the fans are stopped, as a
 * card's are at idle. Bring the pointer near and it is put to work: the fans spin up, the middle one the other way, heat shimmers up
 * off the top, and the temperature climbs; the nearer the middle, the harder it works. Leave and the fans spin down and stop. The
 * fan under the pointer takes the bright edge. The read-out gives the fan speed and the temperature. The slider is the top fan
 * speed, in thousands of rpm.
 *
 * Every part is a plate, its back face, the strips round its edge and its front face, painted back to front; the fans are rings and
 * blades on the front. The pointer is read against the fans' resting circles, which never move.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

// photograph pixels to the stage: x 262..777 across, the middle fan's hub at (520, 300)
// d is how far a face stands toward you, the front at DEPTH; the card recedes back and up to the right
const K = 0.6, S = ([x, y], d = 0) => [186 + (x - 520) * K + (46 - d) * 0.62, 176 + (y - 300) * K - (46 - d) * 0.42];
const DEPTH = 46, FANS = [358, 520, 682], FY = 300, RF = 73, RH = 25;
const ring = (cx, cy, r, n = 56) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
/** a rectangle with round corners */
const box = (x0, y0, x1, y1, r) => [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]].flatMap(([cx, cy, a0]) => Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos(a0 + (i / 5) * (Math.PI / 2)), cy + r * Math.sin(a0 + (i / 5) * (Math.PI / 2))]));
// the shroud's outline, measured: square at the bracket end, chamfered top and bottom at the far end
const SHROUD = [[282, 219], [744, 219], [760, 226], [777, 268], [777, 352], [768, 380], [756, 389], [282, 389], [276, 384], [276, 224]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let top = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const plate = (loop, d0, d1, cls = "sil") => { el("sil").setAttribute("d", poly(loop.map((p) => S(p, d0)))); el("fo").setAttribute("d", loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return poly([S(p, d0), S(q, d0), S(q, d1), S(p, d1)]); }).join("")); const f = el(cls); f.setAttribute("d", poly(loop.map((p) => S(p, d1)))); return f; };
  const heat = el("nf lo");
  // the board under the shroud, its gold fingers with the key notch, and the small tab past them
  plate(box(282, 372, 768, 392, 2), DEPTH * 0.55, DEPTH * 0.62);
  // the backplate, the shroud's body, the fin stack along the top between them
  plate(SHROUD, 0, DEPTH);
  el("nf lo").setAttribute("d", Array.from({ length: 62 }, (_, i) => { const x = 290 + i * 7.5; return open([S([x, 219], 4), S([x, 219], DEPTH - 6)]); }).join(""));
  // the gold fingers, hanging below the shroud near its front, with the key notch
  plate([[352, 389], [368, 389], [368, 404], [352, 404]], DEPTH - 8, DEPTH - 5);
  plate([[373, 389], [500, 389], [500, 404], [373, 404]], DEPTH - 8, DEPTH - 5);
  plate([[500, 389], [512, 389], [512, 398], [508, 402], [500, 402]], DEPTH - 8, DEPTH - 5);
  el("nf lo").setAttribute("d", Array.from({ length: 40 }, (_, i) => { const x = 376 + i * 3.1; return open([S([x, 392], DEPTH - 5), S([x, 403], DEPTH - 5)]); }).join(""));
  // the bracket at the left: plate, top tab and the fork at its foot, with its vent slots
  plate([[262, 232], [279, 232], [279, 410], [276, 416], [276, 437], [271, 437], [271, 418], [266, 418], [266, 437], [262, 437]], DEPTH + 2, DEPTH + 5);
  plate([[244, 232], [279, 232], [279, 238], [248, 238]], DEPTH + 2, DEPTH + 5);
  el("nf lo").setAttribute("d", [262, 274, 286, 298, 310, 322, 334, 346].map((y) => open([S([265, y], DEPTH + 5), S([276, y + 6], DEPTH + 5)])).join(""));
  // the front: the ribbing between the fans, then the fan openings over it
  el("nf lo").setAttribute("d", Array.from({ length: 27 }, (_, i) => { const x = 296 + i * 16; return open([S([x, 224], DEPTH), S([x + 30, 384], DEPTH)]); }).join(""));
  const fans = FANS.map((x, k) => ({ x, dir: k === 1 ? -1 : 1, open_: el(""), frame: el("nf lo"), blades: el("nf"), hub: el("sil"), cap: el("nf lo"), a: k * 0.5, sp: spring(0, { k: 3.2 + k * 0.5, c: 3 }) }));
  let clock = 0, on = false, want = 0, lit = null, temp = 34;

  function draw() {
    for (const f of fans) {
      const P = (pts, d = DEPTH) => poly(pts.map((p) => S(p, d)));
      f.open_.setAttribute("d", P(ring(f.x, FY, RF)));
      f.frame.setAttribute("d", P(ring(f.x, FY, RF - 5)) + [0.6, 2.2, 3.8].map((a) => open([S([f.x + RH * Math.cos(a), FY + RH * Math.sin(a)], DEPTH - 6), S([f.x + (RF - 5) * Math.cos(a), FY + (RF - 5) * Math.sin(a)], DEPTH - 6)])).join(""));
      // eleven broad blades, swept the way the fan turns, set back in the opening
      f.blades.setAttribute("d", Array.from({ length: 11 }, (_, k) => { const a0 = f.a + (k / 11) * 2 * Math.PI; return open(Array.from({ length: 9 }, (_, i) => { const t = i / 8, r = RH + 1 + t * (RF - RH - 8), aa = a0 + f.dir * (t * 0.95 + t * t * 0.25); return S([f.x + r * Math.cos(aa), FY + r * Math.sin(aa)], DEPTH - 3); })); }).join(""));
      f.hub.setAttribute("d", P(ring(f.x, FY, RH, 36), DEPTH - 1));
      f.cap.setAttribute("d", P(ring(f.x, FY, RH * 0.62, 28), DEPTH - 1));
    }
    const h = fans.reduce((s, f) => s + f.sp.x, 0) / 3;
    heat.setAttribute("d", h < 0.12 ? "" : [330, 420, 520, 620, 710].map((x, k) => open(Array.from({ length: 12 }, (_, i) => { const t = i / 11; return S([x + Math.sin(t * 6 - clock * 4 + k) * 5, 214 - t * 80 * h], DEPTH * 0.5); }))).join(""));
  }
  draw();

  const B = register(stage, (dt) => {
    let m = false;
    clock += dt;
    for (const f of fans) { f.sp.t = on ? want : 0; if (stepS(f.sp, dt)) m = true; f.a += f.dir * dt * f.sp.x * top * 3.4; }
    const goal = 34 + (on ? 42 * want : 0); temp += (goal - temp) * Math.min(1, dt * 0.8); if (Math.abs(goal - temp) > 0.3) m = true;
    draw();
    const rpm = fans[1].sp.x * top * 1000;
    read.textContent = rpm > 40 || temp > 35 ? `fans ${Math.round(rpm / 10) * 10} rpm · ${Math.round(temp)}°C` : "rest";
    return m || fans.some((f) => f.sp.x > 0.002) || on;
  });
  bag.add(B.unregister);

  // the pointer back in photograph pixels on the front face, which never moves
  const toPx = (q) => [(q[0] - 186) / K + 520, (q[1] - 176) / K + 300];
  function point(q) {
    const p = q ? toPx(q) : null;
    on = !!p && p[0] > 240 && p[0] < 790 && p[1] > 180 && p[1] < 440;
    const f = on ? fans.find((ff) => Math.hypot(p[0] - ff.x, p[1] - FY) < RF) || null : null;
    if (f !== lit) { if (lit) lit.open_.classList.remove("hi"); lit = f; if (f) f.open_.classList.add("hi"); }
    want = on ? Math.max(0.45, Math.min(1, 1.1 - Math.hypot(p[0] - 520, p[1] - FY) / 330)) : 0;
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { top = v; }, destroy: bag.dispose };
}

hairline({
  name: "gpu",
  means: "A three-fan graphics card on its edge: bring the pointer near and the fans spin up, the middle one the other way; leave and they stop.",
  rules: [1, 3, 7, 8],
  range: [1.6, 2.4, 3.2],
  mount,
});
