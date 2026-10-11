/**
 * Gamepad: the PlayStation DualSense controller, face on, traced from Sony's product photograph: its body with the two grips,
 * the shoulder buttons, the touchpad between its two light bars, the seams of the black panel round the sticks, the d-pad's four keys, the
 * triangle, circle, cross and square buttons, the two thumbsticks, the create and options buttons, the speaker grille, the PS
 * button and the mute button. Every control stands a little proud of the body, its wall showing below it. As the pointer
 * passes over the pad, the control under it presses down into its opening and springs back up when the pointer moves on, so a
 * sweep across it plays the buttons one after another. The pressed control takes the bright edge and its name goes to the
 * read-out. The slider is how far a control goes down.
 *
 * Every outline is in the photograph's pixels (1200 across), measured or traced from it, the body traced from its right half and
 * mirrored, as the controller is symmetric. The control under the pointer is picked from its resting outline.
 */
const { mk, poly, open, spring, stepS, register, pointer, disposer } = HL;

const K = 0.468, IX = 599.5, IY = 334, CX = 200, CY = 168, LIFT = 3.2;
/** A point on screen from the photograph's pixels; up lifts it toward you, which in this view moves it up the screen. */
const S = ([x, y], up = 0) => [CX + (x - IX) * K, CY + (y - IY) * K - up];
const mirror = (pts) => pts.map(([x, y]) => [2 * IX - x, y]).reverse();
const circle = (cx, cy, r, n = 32) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
/** rounds every corner of a closed polygon by r, with n steps a corner */
const round = (pts, r, n = 5) => pts.flatMap((p, i) => {
  const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length], u = [a[0] - p[0], a[1] - p[1]], w = [b[0] - p[0], b[1] - p[1]];
  const lu = Math.hypot(...u), lw = Math.hypot(...w), rr = Math.min(r, lu / 2, lw / 2), s = [p[0] + (u[0] / lu) * rr, p[1] + (u[1] / lu) * rr], e = [p[0] + (w[0] / lw) * rr, p[1] + (w[1] / lw) * rr];
  return Array.from({ length: n + 1 }, (_, k) => { const t = k / n; return [(1 - t) ** 2 * s[0] + 2 * (1 - t) * t * p[0] + t * t * e[0], (1 - t) ** 2 * s[1] + 2 * (1 - t) * t * p[1] + t * t * e[1]]; });
});

const BODY = [[611.3,100.0],[619.7,100.1],[626.6,100.3],[632.0,100.7],[638.9,101.0],[647.4,101.0],[654.3,101.3],[659.7,101.7],[665.4,102.0],[671.4,102.0],[677.6,102.4],[683.9,103.0],[694.6,103.8],[709.5,104.6],[722.1,105.9],[732.4,107.7],[740.4,108.9],[746.1,109.6],[751.5,110.2],[756.5,110.8],[761.5,111.1],[766.5,111.4],[771.5,111.6],[776.5,111.9],[781.5,112.2],[786.5,112.8],[791.5,113.4],[796.5,114.1],[801.5,114.9],[806.5,115.6],[811.5,116.5],[816.5,117.5],[821.5,118.5],[826.5,119.5],[831.5,120.5],[836.5,121.5],[841.5,122.5],[846.5,123.5],[851.5,124.5],[856.5,125.5],[861.5,126.5],[866.5,127.5],[871.5,128.8],[876.5,130.2],[881.0,132.2],[884.8,134.5],[888.2,138.6],[891.2,144.4],[896.2,155.3],[903.5,171.2],[908.8,183.3],[912.1,191.7],[916.1,202.1],[920.9,214.6],[924.0,223.3],[925.6,228.0],[928.8,238.5],[933.5,254.8],[937.2,268.0],[939.8,278.1],[942.6,289.8],[945.4,302.8],[948.3,316.6],[951.1,331.1],[953.6,346.1],[956.0,361.8],[957.5,373.6],[958.4,381.4],[959.3,392.0],[960.3,405.2],[960.8,420.1],[961.0,436.6],[961.0,447.6],[960.8,453.1],[960.5,458.7],[960.0,464.6],[958.8,475.6],[956.8,491.7],[955.1,503.2],[953.7,510.0],[952.5,515.3],[951.3,519.2],[949.9,523.5],[948.2,528.1],[946.1,532.7],[943.9,537.1],[941.7,540.7],[939.5,543.4],[935.0,548.3],[927.9,555.4],[923.0,560.0],[920.2,562.1],[916.5,564.4],[912.0,566.9],[909.0,568.7],[907.7,569.8],[906.0,570.4],[904.0,570.8],[898.5,570.9],[889.5,571.0],[877.8,571.0],[863.2,570.8],[855.3,570.7],[854.0,570.6],[852.8,570.2],[852.0,569.7],[851.3,568.9],[851.0,567.9],[850.8,566.0],[850.8,563.3],[850.6,561.2],[850.3,559.8],[847.9,554.4],[843.4,545.0],[836.6,528.9],[827.4,506.2],[819.3,485.3],[812.2,466.1],[807.0,452.6],[803.6,444.9],[801.2,439.7],[799.8,437.0],[798.1,434.2],[796.2,431.3],[793.9,428.4],[791.2,425.4],[788.6,422.7],[786.1,420.3],[783.2,417.9],[780.1,415.5],[776.5,413.2],[772.7,410.9],[769.1,409.1],[766.0,407.6],[762.7,406.3],[759.4,405.4],[756.3,404.7],[753.3,404.3],[749.7,404.2],[745.2,404.2],[737.6,405.1],[726.9,406.8],[719.3,407.7],[714.8,407.9],[708.9,408.0],[701.4,407.9],[694.7,407.7],[688.8,407.4],[679.4,407.1],[666.4,407.1],[627.4,407.0],[562.4,407.0],[518.7,407.2],[496.3,407.8],[483.1,407.9],[479.2,407.7],[471.4,406.7],[459.6,405.0],[451.6,404.2],[447.1,404.2],[443.2,404.7],[439.9,405.3],[437.0,406.1],[434.7,406.9],[431.9,408.1],[428.8,409.6],[425.7,411.3],[422.7,413.0],[419.8,414.9],[416.9,417.0],[413.0,420.4],[408.1,425.4],[404.0,430.1],[400.8,434.6],[397.0,441.8],[392.5,451.8],[386.7,466.4],[379.6,485.6],[371.5,506.5],[362.3,529.2],[355.6,545.0],[351.3,554.0],[349.0,559.4],[348.5,561.3],[348.2,563.8],[348.1,566.8],[347.8,568.8],[347.2,569.6],[346.1,570.2],[344.5,570.6],[341.5,570.8],[337.0,571.0],[326.2,571.0],[309.2,570.9],[298.6,570.8],[294.5,570.6],[291.6,569.9],[290.0,568.6],[287.1,566.9],[282.9,564.7],[279.4,562.6],[276.6,560.4],[271.5,555.7],[264.0,548.3],[259.3,543.2],[257.2,540.5],[254.7,536.0],[251.6,529.6],[249.0,522.9],[246.8,515.8],[245.0,508.8],[243.7,502.0],[242.5,495.0],[241.5,487.6],[240.3,477.1],[239.0,463.4],[238.3,445.3],[238.2,422.8],[238.7,405.0],[239.7,391.7],[241.3,376.0],[243.6,357.8],[246.5,339.0],[250.2,319.8],[253.5,303.3],[256.5,289.7],[259.3,277.8],[261.9,267.7],[265.7,254.0],[270.8,236.8],[276.2,220.3],[282.0,204.4],[286.6,192.3],[290.0,184.1],[295.5,171.5],[303.1,154.6],[308.5,143.1],[311.9,137.0],[315.1,133.2],[318.4,131.7],[322.5,130.2],[327.5,128.8],[332.5,127.5],[337.5,126.5],[342.5,125.5],[347.5,124.5],[352.5,123.5],[357.5,122.5],[362.5,121.5],[367.5,120.5],[372.5,119.5],[377.5,118.5],[382.5,117.5],[387.5,116.5],[392.5,115.6],[397.5,114.9],[402.5,114.1],[407.5,113.4],[412.5,112.8],[417.5,112.2],[422.5,111.9],[427.5,111.6],[432.5,111.4],[437.5,111.1],[442.5,110.8],[447.5,110.2],[452.9,109.6],[458.8,108.9],[466.9,107.6],[477.1,105.9],[489.7,104.6],[504.6,103.7],[515.1,103.0],[520.9,102.4],[527.1,102.0],[533.6,102.0],[539.3,101.7],[544.2,101.3],[550.9,101.0],[559.4,101.0],[567.1,100.7],[573.9,100.2],[584.6,100.0],[599.0,100.0],[606.4,100.0],[606.9,100.0]];
// the seams where the white wings meet the black panel, from each foot up to the touchpad
const SEAMS = [[[307.4,557.1],[310.9,550.0],[317.7,531.2],[322.7,513.9],[329.4,494.0],[341.0,462.2],[352.9,432.6],[370.1,394.5],[385.3,364.1],[398.4,340.5],[411.1,320.2],[423.8,302.2],[437.5,285.0],[452.5,267.5],[458.3,259.4],[464.1,247.8],[465.9,242.1],[467.6,233.9],[468.2,233.1],[471.6,240.5],[475.6,246.2],[484.0,254.8],[486.2,256.5],[488.5,257.4]],[[710.8,257.4],[713.0,256.4],[715.3,254.6],[722.9,246.7],[727.0,241.1],[730.4,233.6],[731.1,233.2],[734.7,247.2],[740.4,258.9],[746.1,267.0],[761.7,285.3],[775.4,302.5],[788.1,320.5],[800.8,340.8],[813.9,364.3],[828.6,393.9],[846.2,432.9],[858.1,462.5],[869.7,494.3],[876.1,513.3],[881.1,530.5],[888.2,550.3],[891.7,557.4]]];
// the right shoulder button, measured row by row above the body; its foot is hidden behind the body
const R1 = round([[775, 128], [775.5, 113], [778.5, 96], [789, 94], [814, 96], [837, 100], [854, 106], [865, 112], [870, 118], [872, 128]], 4);
// the touchpad, between the light bars: its left edge measured down the inside of the left bar, its top along the body's crown
const PAD_L = [[600, 100.5], [560, 101], [520, 104], [478, 108], [458, 114], [461, 145], [465, 172], [469, 200], [474, 225], [480, 240], [490, 250], [503, 256], [540, 257.5], [600, 258]];
const PAD = round([...PAD_L.slice(0, -1), ...mirror(PAD_L).slice(1)], 3);
const BAR = [[449, 117], [452, 135], [457, 160], [462, 185], [466, 210], [469, 232], [471, 246]];
/** a d-pad key pointing at the pad's middle (375, 232) from direction a: its tip 7 out, its shoulders 26, its end 61 */
const key = (a) => { const c = Math.cos(a), s = Math.sin(a), at = (d, w) => [375 + c * d - s * w, 232 + s * d + c * w]; return round([at(7, 0), at(26, -22.5), at(61, -22.5), at(61, 22.5), at(26, 22.5)], 7); };
const arrowMark = (a) => { const c = Math.cos(a), s = Math.sin(a), at = (d, w) => [375 + c * d - s * w, 232 + s * d + c * w]; return [at(39, -5), at(46, 0), at(39, 5), at(39, -5)]; };
const pill = (cx, cy, len, wid, tilt) => { const c = Math.cos(tilt), s = Math.sin(tilt); return round([[-wid / 2, -len / 2], [wid / 2, -len / 2], [wid / 2, len / 2], [-wid / 2, len / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]), wid / 2, 6); };
const FACE = { triangle: [824.8, 179.3], square: [771.7, 232.2], circle: [877.9, 232.1], cross: [824.7, 285.5] };
const STICKS = [[IX - 118.5, 330], [IX + 118.5, 330]];
// the PS button: the PlayStation mark's silhouette, traced from the photograph
const PS = [[[594.6,306.2],[605.2,309.1],[611.3,312.4],[613.2,315.1],[614.4,318.1],[614.7,327.0],[621.1,329.3],[623.4,330.9],[624.5,333.0],[624.4,334.4],[623.3,336.5],[620.7,338.5],[602.4,345.0],[600.0,344.8],[589.3,341.6],[582.1,340.9],[577.1,338.6],[575.8,337.1],[574.6,335.1],[575.8,332.2],[578.1,330.6],[589.9,326.4],[591.7,325.1],[592.1,309.0],[592.8,307.3],[594.2,306.3]]];
// the controls: their outlines, their names, and the marks on their tops
const CONTROLS = [
  { name: "touchpad", loops: [PAD], lift: 1.6 },
  { name: "L1", loops: [mirror(R1)], lift: 2.2 }, { name: "R1", loops: [R1], lift: 2.2 },
  { name: "up", loops: [key(-Math.PI / 2)], mark: [arrowMark(-Math.PI / 2)] }, { name: "right", loops: [key(0)], mark: [arrowMark(0)] },
  { name: "down", loops: [key(Math.PI / 2)], mark: [arrowMark(Math.PI / 2)] }, { name: "left", loops: [key(Math.PI)], mark: [arrowMark(Math.PI)] },
  { name: "triangle", loops: [circle(...FACE.triangle, 22.9)], mark: [[[824.8, 167.5], [835, 185], [814.6, 185], [824.8, 167.5]]] },
  { name: "square", loops: [circle(...FACE.square, 22.8)], mark: [[[762, 222.5], [781.5, 222.5], [781.5, 242], [762, 242], [762, 222.5]]] },
  { name: "circle", loops: [circle(...FACE.circle, 22.6)], mark: [[...circle(...FACE.circle, 11.5, 24), [889.4, 232.1]]] },
  { name: "cross", loops: [circle(...FACE.cross, 22.9)], mark: [[[815, 275.8], [834.4, 295.2]], [[834.4, 275.8], [815, 295.2]]] },
  { name: "left stick", loops: [circle(...STICKS[0], 44)], mark: [[...circle(...STICKS[0], 34, 40), [STICKS[0][0] + 34, 330]]], lift: 5 },
  { name: "right stick", loops: [circle(...STICKS[1], 44)], mark: [[...circle(...STICKS[1], 34, 40), [STICKS[1][0] + 34, 330]]], lift: 5 },
  { name: "create", loops: [pill(433, 153, 32, 20, -0.18)], mark: [[[424, 126], [426, 132]], [[431, 124], [431.5, 130.5]], [[438, 125], [436, 131]]] },
  { name: "options", loops: [pill(2 * IX - 433, 153, 32, 20, 0.18)], mark: [[[758, 126], [767, 126]], [[758, 129.5], [767, 129.5]], [[758, 133], [767, 133]]] },
  { name: "PS button", loops: PS, lift: 1.4, mark: [[[602.5, 313], [602.5, 343]], round([[603.5, 317], [608, 318.5], [608.5, 326], [603.5, 327]], 1.5).concat([[603.5, 317]])] },
  { name: "mute", loops: [pill(IX, 370.5, 32, 7.5, Math.PI / 2)], lift: 1.4 },
].map((c) => ({ lift: LIFT, mark: [], ...c }));
const GRILLE = [...[574, 587, 600, 613, 626].map((x) => [x, 279]), ...[580.5, 593.5, 606.5, 619.5].map((x) => [x, 290.5])];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let depth = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  // the body, the black panel, the light bars and the grille never move
  const shoulders = CONTROLS.filter((c) => c.name === "L1" || c.name === "R1"), rest = CONTROLS.filter((c) => !shoulders.includes(c));
  const make = (c) => ({ ...c, well: el("nf lo"), wall: el("fo"), cap: el("sil"), marks: el("nf lo"), sp: spring(0) });
  // the shoulder buttons sit behind the body; everything else on it
  const back = shoulders.map(make);
  el("sil").setAttribute("d", poly(BODY.map((p) => S(p))));
  el("nf").setAttribute("d", SEAMS.map((l) => open(l.map((p) => S(p)))).join(""));
  el("nf lo").setAttribute("d", open(BAR.map((p) => S(p))) + open(mirror(BAR).map((p) => S(p))));
  el("nf lo").setAttribute("d", GRILLE.map(([x, y]) => poly(circle(x, y, 4, 12).map((p) => S(p)))).join(""));
  const controls = [...back, ...rest.map(make)];
  function draw() {
    for (const c of controls) {
      const up = c.lift * (1 - Math.min(0.9, depth) * c.sp.x);
      c.well.setAttribute("d", c.loops.map((l) => poly(l.map((p) => S(p)))).join(""));
      // the wall: the strips between the opening and the raised cap
      c.wall.setAttribute("d", c.loops.map((l) => l.map((a, i) => { const b = l[(i + 1) % l.length]; return poly([S(a, up), S(b, up), S(b), S(a)]); }).join("")).join(""));
      c.cap.setAttribute("d", c.loops.map((l) => poly(l.map((p) => S(p, up)))).join(""));
      c.marks.setAttribute("d", c.mark.map((m) => open(m.map((p) => S(p, up)))).join(""));
    }
  }
  draw();

  const B = register(stage, (dt) => { let m = false; for (const c of controls) if (stepS(c.sp, dt)) m = true; draw(); return m; });
  bag.add(B.unregister);

  // each control's resting cap on screen; the last drawn that holds the pointer is the one on top
  const inside = (q, pts) => { let k = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) k = !k; return k; };
  const hits = controls.map((c) => ({ c, loops: c.loops.map((l) => l.map((p) => S(p, c.lift))) }));
  let lit = null;
  function point(q) {
    let c = null;
    if (q) for (const h of hits) if (h.loops.some((l) => inside(q, l))) c = h.c;
    if (c !== lit) { lit = c; for (const k of controls) { k.sp.t = k === c ? 1 : 0; k.cap.classList.toggle("hi", k === c); } }
    read.textContent = c ? c.name : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { depth = v; draw(); }, destroy: bag.dispose };
}

hairline({
  name: "gamepad",
  means: "A DualSense controller: the button under the pointer presses down and springs back up, so a sweep across it plays them in turn.",
  rules: [1, 4, 6, 8, 10],
  range: [0.4, 0.75, 0.9],
  mount,
});
