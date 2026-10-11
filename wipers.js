/**
 * Wipers: a car, face on: its roof and pillars, the windshield, the bonnet, the headlights, the grille and the bumper, the tyres
 * below, and two wipers lying parked at the foot of the glass, which is spotted with rain. Bring the pointer near and the rain keeps
 * coming and the wipers sweep, the two arms swinging together across the glass and back, each drop cleared as a blade passes over
 * it; leave and they come to rest parked and the drops gather again. The wipers take the bright edge while they run. The read-out
 * counts the drops on the glass. The slider is how fast the wipers sweep, in sweeps a second.
 *
 * Every part is a plate, its back face, the strips round its edge and its front face; the drops are rings on the glass. The pointer
 * is read against the car's resting outline.
 */
const { mk, open, poly, disposer, pointer, register } = HL;

const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const ell = (cx, cy, rx, ry, n = 24) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
const box = (x0, y0, x1, y1, r = 4) => [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]].flatMap(([cx, cy, a0]) => Array.from({ length: 7 }, (_, i) => [cx + r * Math.cos(a0 + (i / 6) * (Math.PI / 2)), cy + r * Math.sin(a0 + (i / 6) * (Math.PI / 2))]));
const GLASS = [[128, 76], [272, 76], [304, 150], [96, 150]], PIV = [[150, 154], [252, 154]], ARM = 92, PARK = -0.06, SWEEP = 2.55;
/** whether a point is on the glass */
const onGlass = ([x, y]) => y > 80 && y < 146 && x > 128 - ((y - 76) / 74) * 32 + 4 && x < 272 + ((y - 76) / 74) * 32 - 4;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let rate = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const plate = (loop, d0, d1, cls = "sil") => { el("sil").setAttribute("d", poly(loop.map((p) => S(p, d0)))); el("fo").setAttribute("d", loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return poly([S(p, d0), S(q, d0), S(q, d1), S(p, d1)]); }).join("")); const f = el(cls); f.setAttribute("d", poly(loop.map((p) => S(p, d1)))); return f; };
  // the tyres, then the body: roof and pillars round the glass, the bonnet below it, the bumper
  plate(box(70, 222, 112, 270, 9), 4, 16); plate(box(288, 222, 330, 270, 9), 4, 16);
  plate([[120, 58], [280, 58], [300, 66], [326, 150], [350, 168], [356, 238], [44, 238], [50, 168], [74, 150], [100, 66]], 6, 18);
  el("nf").setAttribute("d", poly(GLASS.map((p) => S(p, 18))));
  el("nf lo").setAttribute("d", open([[74, 150], [326, 150]].map((p) => S(p, 18))) + open([[60, 200], [340, 200]].map((p) => S(p, 18))));
  // headlights, grille, bumper, mirrors
  plate(box(62, 172, 116, 192, 8), 18, 21); plate(box(284, 172, 338, 192, 8), 18, 21);
  plate(box(140, 176, 260, 196, 6), 18, 20);
  el("nf lo").setAttribute("d", [150, 165, 180, 195, 210, 225, 240, 250].map((x) => open([[x, 180], [x, 192]].map((p) => S(p, 20)))).join(""));
  plate(box(52, 210, 348, 232, 8), 18, 23);
  plate(box(56, 124, 84, 140, 6), 10, 16); plate(box(316, 124, 344, 140, 6), 10, 16);
  const dropsEl = el("nf"), wipers = [0, 1].map(() => ({ arm: el("sil"), blade: el("sil") }));
  // the drops: some already on the glass at rest
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let drops = [];
  const spawn = () => { for (let k = 0; k < 20; k++) { const p = [100 + rnd() * 200, 80 + rnd() * 66]; if (onGlass(p)) { drops.push({ p, r: 1.4 + rnd() * 2 }); return; } } };
  for (let k = 0; k < 16; k++) spawn();
  let on = false, phase = 0, ang = PARK, rain = 0;

  function draw() {
    dropsEl.setAttribute("d", drops.map((d) => poly(ell(d.p[0], d.p[1], d.r, d.r * 1.25, 10).map((p) => S(p, 18.5)))).join(""));
    wipers.forEach((w, k) => {
      const pv = PIV[k], a = -ang, tip = [pv[0] + ARM * Math.cos(a), pv[1] + ARM * Math.sin(a)], n = [-Math.sin(a), Math.cos(a)];
      w.arm.setAttribute("d", poly([pv, tip].flatMap((p, i) => (i ? [[p[0] + n[0] * 1.2, p[1] + n[1] * 1.2], [p[0] - n[0] * 1.2, p[1] - n[1] * 1.2]] : [[p[0] - n[0] * 2, p[1] - n[1] * 2], [p[0] + n[0] * 2, p[1] + n[1] * 2]])).map((p) => S(p, 22))));
      const b0 = [pv[0] + ARM * 0.28 * Math.cos(a), pv[1] + ARM * 0.28 * Math.sin(a)];
      w.blade.setAttribute("d", poly([[b0[0] + n[0] * 2.4, b0[1] + n[1] * 2.4], [tip[0] + n[0] * 2.4, tip[1] + n[1] * 2.4], [tip[0] - n[0] * 0.6, tip[1] - n[1] * 0.6], [b0[0] - n[0] * 0.6, b0[1] - n[1] * 0.6]].map((p) => S(p, 20))));
    });
  }
  draw();

  const B = register(stage, (dt) => {
    const before = ang;
    if (on) { phase += dt * rate * Math.PI; rain += dt * 6; while (rain > 1) { rain -= 1; spawn(); } }
    else if (ang > PARK + 0.002) phase += dt * rate * Math.PI * 1.4;
    // the arms swing across and back; parked, they stop at the foot of the glass
    let a = PARK + SWEEP * (0.5 - 0.5 * Math.cos(phase));
    if (!on && (phase % (2 * Math.PI)) < 0.05 + dt * rate * Math.PI * 1.4) { phase = 0; a = PARK; }
    ang = a;
    // a drop is cleared once a blade has passed over it
    const lo = Math.min(before, ang), hi = Math.max(before, ang);
    drops = drops.filter((d) => !PIV.some((pv) => { const dx = d.p[0] - pv[0], dy = pv[1] - d.p[1], r = Math.hypot(dx, dy), t = Math.atan2(dy, dx); return r > ARM * 0.26 && r < ARM && t >= lo - 0.05 && t <= hi + 0.05; }));
    if (!on && ang <= PARK + 0.002) rain += dt * 0.6, (rain > 1 && drops.length < 16 ? (rain -= 1, spawn()) : 0);
    draw();
    read.textContent = on ? `wipers on · ${drops.length} drops` : drops.length ? `${drops.length} drops` : "rest";
    if (!on && ang <= PARK + 0.002 && drops.length >= 16) read.textContent = "rest";
    return on || ang > PARK + 0.002 || drops.length < 16;
  });
  bag.add(B.unregister);

  function point(q) {
    const n = !!q && q[0] > 30 && q[0] < 370 && q[1] > 40 && q[1] < 290;
    if (n !== on) { on = n; wipers.forEach((w) => { w.arm.classList.toggle("hi", n); w.blade.classList.toggle("hi", n); }); }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = v; }, destroy: bag.dispose };
}

hairline({
  name: "wipers",
  means: "A car in the rain: bring the pointer near and the wipers sweep the windshield, clearing the drops; leave and they park.",
  rules: [1, 4, 6, 7],
  range: [0.6, 1, 1.6],
  mount,
});
