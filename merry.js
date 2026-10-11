/**
 * Merry: the Going Merry, the Straw Hats' first ship, traced from an anime still of her seen from ahead and to port:
 * the round white sheep's head with its curled ram's horn and smile on a bent, banded neck; under it the white bow with
 * a cannon run out of its port; the white rail along the bow; the white wales and the claw-shaped ribs hanging down
 * her side; a strap with a ring and rope; the planked hull over a dark bottom. The main mast is banded and has a bowl
 * of a crow's nest; its long yard runs up across her, with the sail furled in loose festoons beneath it, and rope
 * ladders run down on either side. Aft are the tangerine trees on the cabin roof, the cabin with its round window,
 * the two white scrolls and the curled stern rail, and the mizzen with its slanting yard, the red-and-white striped
 * sail and the black flag.
 * Bring the pointer near and the wind fills her: the festoons swell, the flags stream, she sails toward the pointer,
 * riding up and down on the swell as she goes, a wake trailing from her stern; leave and the sails fall slack and she
 * rides still. The mainsail takes the bright edge while it draws. The read-out gives her speed; the slider is how
 * hard the wind fills the sails.
 *
 * Every point is kept in the still's pixels and scaled by K about her middle; everything turns about it as she pitches.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const TAU = 2 * Math.PI, K = 0.31, MX = 537, MY = 443, CY = 170;
const L = ([x, y]) => [(x - MX) * K, (y - MY) * K];
const ring = (cx, cy, rx, ry = rx, n = 24) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * TAU), cy + ry * Math.sin((i / n) * TAU)]);
const spiral = (cx, cy, r, turns, a0 = 0) => Array.from({ length: 32 }, (_, i) => { const t = i / 31, a = a0 + t * turns * TAU, q = r * (1 - 0.85 * t); return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; });
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
/** a closed Catmull-Rom curve through the points */
const smooth = (ps, n = 5) => ps.flatMap((p, i) => { const q = ps[(i + 1) % ps.length], a = ps[(i - 1 + ps.length) % ps.length], b = ps[(i + 2) % ps.length]; return Array.from({ length: n }, (_, k) => { const t = k / n; return [0, 1].map((j) => 0.5 * (2 * p[j] + (q[j] - a[j]) * t + (2 * a[j] - 5 * p[j] + 4 * q[j] - b[j]) * t * t + (3 * p[j] - a[j] - 3 * q[j] + b[j]) * t * t * t)); }); });
/** a band of width w along a polyline, as a closed outline */
const band = (ps, w) => { const side = (sg) => ps.map((p, i) => { const a = ps[Math.max(0, i - 1)], b = ps[Math.min(ps.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - (sg * w * (b[1] - a[1])) / l / 2, p[1] + (sg * w * (b[0] - a[0])) / l / 2]; }); return [...side(1), ...side(-1).reverse()]; };
/** the y of a polyline at x */
const at = (ps, x) => { for (let i = 1; i < ps.length; i++) if (x <= ps[i][0]) { const a = ps[i - 1], b = ps[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); } return ps[ps.length - 1][1]; };
/** a claw-shaped rib hanging from (x, y0) to its tip at y1, leaning by lean */
const rib = (x, y0, y1, w, lean) => smooth([[x - w / 2, y0], [x + w / 2, y0], [x + w / 2 + lean * 0.3, lerp(y0, y1, 0.6)], [x + lean, y1], [x - w / 2 + lean * 0.5, lerp(y0, y1, 0.6)]], 4);

// the bow
const HEAD = ring(89, 440, 84, 73, 40), EAR = ring(72, 374, 15, 9);
const HORN = ring(198, 396, 45, 48, 32), HORN_CURL = spiral(206, 410, 17, 1.4, Math.PI);
const FACE = { eye: ring(128, 405, 13, 17), pupil: ring(127, 409, 7, 10), lines: [[[20, 435], [32, 446], [47, 430]], [[32, 446], [30, 472]], [[30, 476], [55, 484], [82, 476]]] };
const NECK = smooth([[122, 500], [127, 540], [140, 560], [222, 558], [225, 520], [218, 488], [204, 468], [184, 455], [160, 452]], 8), NECK_BANDS = [[[124, 514], [221, 502]], [[131, 548], [223, 540]]];
const BOW_RAIL = band([[68, 600], [100, 578], [140, 561], [230, 553], [330, 550], [400, 550], [470, 560], [505, 576]], 14);
const BALUSTERS = [[84, 590], [101, 580], [120, 570], ...[250, 288, 333, 380, 440, 475].map((x) => [x, 559])].map(([x, y]) => [[x, y], [x, x < 200 ? 640 : at([[230, 598], [420, 612], [560, 650]], x)]]);
const BOW_POST = rect(398, 538, 420, 575), BOW_SCROLL = ring(512, 582, 14), BOW_SCROLL_IN = spiral(512, 583, 10, 1.3);
const PLATE = smooth([[62, 605], [100, 581], [140, 562], [230, 562], [255, 600], [290, 660], [315, 720], [337, 772], [110, 786], [80, 790], [67, 760]], 8), PLATE_LINE = [[228, 602], [262, 662], [290, 722], [306, 768]];
const PORT = smooth([[132, 755], [132, 665], [150, 632], [195, 615], [240, 628], [258, 665], [262, 755]], 8), PORT_RIM = [[146, 712], [150, 652], [195, 630], [243, 650], [250, 712]];
const BARREL = [[118, 672], [160, 676], [175, 668], [195, 670], [250, 680], [250, 740], [195, 745], [175, 748], [160, 738], [118, 738]], MUZZLE = ring(118, 705, 18, 33), BORE = ring(118, 705, 11, 22);
const STRAP = [[383, 608], [413, 606], [416, 800], [386, 802]], ANCHOR = [ring(375, 712, 11), ring(375, 712, 5)], RIVETS = [632, 668, 760].map((y) => ring(399, y, 3, 3, 8)), ROPE = [[377, 723], [374, 800], [380, 885]];
// the hull
const HULL = smooth([[62, 640], [62, 605], [140, 560], [250, 598], [420, 612], [560, 648], [640, 688], [785, 700], [890, 745], [887, 850], [870, 873], [700, 880], [500, 885], [300, 888], [160, 886], [122, 862], [98, 812], [72, 792]], 6);
const HULL_LINES = [[[96, 798], [500, 801], [886, 807]], [[300, 692], [560, 712]], [[300, 722], [566, 740]], [[780, 760], [886, 770]]];
const SIDE_WINDOW = [smooth(rect(818, 748, 848, 795), 2), ring(833, 772, 6, 12)];
const WALE = [[230, 598], [420, 612], [560, 650], [640, 690], [630, 725], [560, 688], [420, 655], [240, 640]];
const LOW_WALE = [[105, 760], [560, 775], [770, 785], [768, 802], [560, 796], [108, 782]];
const RIBS = [rib(528, 680, 878, 18, -12), rib(605, 790, 880, 16, -8), rib(675, 790, 878, 14, -6), rib(742, 790, 870, 12, -4), rib(795, 720, 858, 14, -6), rib(860, 745, 832, 12, -4), band([[150, 782], [205, 888]], 16), band([[205, 795], [262, 892]], 14)];
// the stern
const SCROLLS = [ring(605, 735, 33), ring(740, 733, 40)], SCROLLS_IN = [spiral(605, 738, 24, 1.6), spiral(742, 736, 30, 1.6)];
const RAIL_TOP = [[805, 632], [860, 640], [905, 655], [935, 685], [925, 712]], RAIL_BOT = [[770, 712], [830, 722], [880, 735], [918, 742]];
const STERN_RAIL = [band(RAIL_TOP, 12), band(RAIL_BOT, 10)], STERN_POSTS = [0.15, 0.32, 0.5, 0.68, 0.85].map((t) => { const i = t * (RAIL_TOP.length - 2), a = RAIL_TOP[Math.floor(i)], b = RAIL_TOP[Math.floor(i) + 1], x = lerp(a[0], b[0], i % 1); return [[x, lerp(a[1], b[1], i % 1) + 6], [lerp(780, 915, t), at(RAIL_BOT, lerp(780, 915, t)) - 5]]; });
const RAIL_SCROLL = ring(838, 648, 16), RAIL_SCROLL_IN = spiral(838, 650, 11, 1.3);
const CABIN = [[570, 618], [785, 626], [783, 745], [570, 742]], ROOF = [[562, 603], [790, 611], [790, 626], [562, 618]];
const PLANKS = Array.from({ length: 11 }, (_, i) => 590 + i * 18).map((x) => [[x, 622 + (x - 570) * 0.037], [x, 742]]);
const WINDOW = [ring(686, 655, 15), ring(686, 655, 10)], DOOR = [[598, 700], [598, 655], [612, 640], [628, 640], [640, 655], [640, 700]];
const peaks = [[566, 612], [570, 560], [585, 528], [615, 515], [648, 510], [680, 512], [712, 505], [745, 515], [770, 535], [788, 565], [796, 612]];
const BUSH = smooth(peaks.flatMap((p, i) => { const q = peaks[i + 1]; if (!q) return [p]; const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = Math.hypot(m[0] - 680, m[1] - 620) || 1; return [p, [m[0] + ((m[0] - 680) / d) * 9, m[1] + ((m[1] - 620) / d) * 9]]; }), 3);
const ORANGES = [[600, 545], [640, 530], [690, 540], [725, 528], [760, 555], [660, 575], [610, 585], [740, 590]].map(([x, y]) => ring(x, y, 3, 3, 8));
// the main mast, its nest, ladders and stay
const MAST = rect(527, 95, 558, 475), MAST_LINES = [[[527, 250], [558, 250]], [[527, 320], [558, 320]], [[527, 395], [558, 395]], ...[285, 350, 420].flatMap((y) => [[[527, y + 10], [558, y - 5]], [[527, y + 28], [558, y + 13]]])];
const BASE = smooth(rect(495, 470, 568, 645), 1), BASE_LINES = [...[510, 525, 540, 555].map((x) => [[x, 475], [x, 640]]), [[495, 520], [568, 500]], [[495, 560], [568, 540]]];
const NEST = smooth([[486, 50], [610, 50], [585, 100], [512, 100]], 2), NEST_RIM = ring(548, 50, 62, 13, 32), NEST_LINE = [[497, 74], [598, 74]], STUB = rect(543, 0, 553, 40);
const ladder = (tops, bots) => [...tops.map((t, i) => [t, bots[i]]), ...[0.2, 0.35, 0.5, 0.65, 0.8].map((u) => [[lerp(tops[0][0], bots[0][0], u), lerp(tops[0][1], bots[0][1], u)], [lerp(tops[2][0], bots[2][0], u), lerp(tops[2][1], bots[2][1], u)]])];
const ROPES = [...ladder([[472, 248], [482, 248], [492, 248]], [[352, 548], [395, 548], [438, 548]]), ...ladder([[580, 232], [592, 232], [604, 232]], [[700, 605], [745, 612], [792, 612]]), [[228, 530], [470, 232]]];
const BLOCK = ring(256, 494, 4, 7, 10);
// the mainsail, furled in festoons under its long yard
const yardY = (x) => 215 - (x - 255) * 0.3452;
const YARD = band([[255, 215], [872, 2]], 8);
const SAIL_LOW = [[275, 212], [282, 232], [320, 240], [360, 232], [400, 185], [420, 205], [450, 235], [500, 255], [550, 255], [610, 240], [660, 210], [700, 170], [725, 120], [735, 50], [750, 70], [780, 90], [800, 95], [830, 80], [860, 40], [870, 10]];
const FOLDS = [440, 500, 560, 620, 680, 770, 830], TIES = [400, 735];
// the mizzen, its striped sail and flag
const MZ = [[819, 243], [825, 243], [811, 700], [805, 700]], mzY = (x) => 510 - (x - 636) * 0.4954, MZ_YARD = band([[636, 510], [1068, 296]], 6);
const MZ_LOW = [[645, 507], [680, 528], [715, 522], [745, 470], [760, 482], [820, 497], [880, 487], [930, 457], [980, 417], [1025, 372], [1055, 320], [1066, 300]];
const MZ_STRIPES = [700, 790, 850, 905, 955, 1000, 1040], MZ_ROPES = [[[823, 262], [1068, 296]], [[823, 340], [785, 425]], [[823, 340], [862, 392]]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let fill = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const sea = el("nf"), wake = el("nf");
  const mzPole = el("sil"), mzFlag = el("sil"), mzSail = el("sil"), mzLines = el("nf"), mzYard = el("sil"), mzRopes = el("nf");
  const mast = el("sil"), mastL = el("nf"), nest = el("sil"), nestL = el("nf"), stub = el("sil"), flag = el("sil");
  const sail = el("sil"), sailL = el("nf"), yard = el("sil");
  const hull = el("sil"), hullL = el("nf"), bush = el("sil"), bushL = el("nf"), cabin = el("sil"), roof = el("sil"), cabinL = el("nf");
  const ropes = el("nf"), base = el("sil"), baseL = el("nf");
  const rail = el("sil"), railL = el("nf"), ribs = el("sil"), scrolls = el("sil"), scrollsL = el("nf"), wale = el("sil"), lowWale = el("sil");
  const bowRail = el("sil"), bowRailL = el("nf"), plate = el("sil"), port = el("sil"), portL = el("nf"), barrel = el("sil"), muzzle = el("sil"), cannonL = el("nf");
  const strap = el("sil"), strapL = el("nf"), neck = el("sil"), neckL = el("nf"), horn = el("sil"), hornL = el("nf"), ear = el("sil"), head = el("sil"), face = el("nf");
  const go = spring(0, { k: 8, c: 5.5, eps: 0.002 }), x = spring(0, { k: 6, c: 5, eps: 0.05 });
  let clock = 0;
  function draw() {
    const f = go.x, w = f * fill, bob = Math.sin(clock * 2.2) * (0.8 + 1.4 * f), pitch = Math.sin(clock * 2.2 + 0.9) * (0.004 + 0.012 * f), c = Math.cos(pitch), s = Math.sin(pitch);
    const T = (p) => { const [px, py] = L(p); return [200 + x.x + px * c - py * s, CY + bob + px * s + py * c]; };
    const D = (pts) => poly(pts.map(T)), O = (pts) => open(pts.map(T)), set = (e, d) => e.setAttribute("d", d);
    // the sea: two swells running under her
    set(sea, [0, 1].map((k) => open(Array.from({ length: 41 }, (_, i) => { const px = i * 10; return [px, CY + (868 - MY) * K + k * 8 + Math.sin(px / 34 - clock * 2.2 * (1 + k * 0.3) + k) * (1.5 + 1.5 * f)]; }))).join(""));
    // the wake: short strokes streaming back from her stern while she makes way
    set(wake, f < 0.08 ? "" : [0, 1, 2, 3].map((k) => { const px = 892 + ((clock * 60 + k * 22) % 80) * 0.5, py = 850 + (k % 2) * 14; return open([T([px, py]), T([px + 30 * f, py + 1])]); }).join(""));
    // the mizzen: its pole, the flag streaming from it, the striped sail in festoons under its slanting yard
    set(mzPole, D(MZ));
    const fl = Array.from({ length: 10 }, (_, i) => i / 9), wave = (u, y) => Math.sin(u * 5 - clock * 7) * u * (1 + 3 * f) + y, len = lerp(42, 50, f);
    set(mzFlag, D([...fl.map((u) => [826 + u * len, wave(u, 283)]), ...fl.slice().reverse().map((u) => [826 + u * len, wave(u, 328 - u * 2)])]));
    const swell = 1 + 0.3 * w, mzLow = (px) => mzY(px) + 3 + (at(MZ_LOW, px) - mzY(px) - 3) * swell;
    const mxs = Array.from({ length: 44 }, (_, i) => lerp(645, 1066, i / 43));
    set(mzSail, D([...mxs.map((px) => [px, mzY(px) + 3]), ...mxs.slice().reverse().map((px) => [px, mzLow(px)])]));
    set(mzLines, MZ_STRIPES.map((px) => O([[px, mzY(px) + 3], [px - 6, mzLow(px - 6)]])).join("") + D(ring(847, 305 + wave(0.5, 0) - 0.5, 6, 6, 10).map(([a, b]) => [a + len * 0.02, b])));
    set(mzYard, D(MZ_YARD)); set(mzRopes, MZ_ROPES.map(O).join(""));
    // the main mast, its banded top, the crow's nest and the flag above it
    set(mast, D(MAST)); set(mastL, MAST_LINES.map(O).join(""));
    set(nest, D(NEST)); set(nestL, D(NEST_RIM) + O(NEST_LINE)); set(stub, D(STUB));
    set(flag, D([...fl.map((u) => [553 + u * lerp(44, 52, f), wave(u, 2)]), ...fl.slice().reverse().map((u) => [553 + u * lerp(44, 52, f), wave(u, 24)])]));
    // the mainsail: its festoons hang lower and swell as the wind fills them
    const low = (px) => yardY(px) + 4 + (at(SAIL_LOW, px) - yardY(px) - 4) * swell;
    const xs = Array.from({ length: 60 }, (_, i) => lerp(275, 870, i / 59));
    set(sail, D([...xs.map((px) => [px, yardY(px) + 4]), ...xs.slice().reverse().map((px) => [px, low(px)])]));
    set(sailL, [...FOLDS.map((px) => O([[px, yardY(px) + 4], [px - 4, low(px - 4) - 2]])), ...TIES.map((px) => O([[px - 4, yardY(px) - 2], [px + 4, yardY(px) + 12]]))].join(""));
    set(yard, D(YARD));
    // the hull, the tangerine trees, the cabin
    set(hull, D(HULL)); set(hullL, [...HULL_LINES.map(O), ...SIDE_WINDOW.map(D)].join(""));
    set(bush, D(BUSH)); set(bushL, ORANGES.map(D).join(""));
    set(cabin, D(CABIN)); set(roof, D(ROOF)); set(cabinL, [...PLANKS.map(O), ...WINDOW.map(D), O(DOOR)].join(""));
    // the rope ladders and the stay, then the foot of the mast
    set(ropes, ROPES.map(O).join("") + D(BLOCK));
    set(base, D(BASE)); set(baseL, BASE_LINES.map(O).join(""));
    // the stern rail, the ribs, the scrolls and the white wales
    set(rail, STERN_RAIL.map(D).join("") + D(RAIL_SCROLL)); set(railL, STERN_POSTS.map(O).join("") + O(RAIL_SCROLL_IN));
    set(ribs, RIBS.map(D).join(""));
    set(scrolls, SCROLLS.map(D).join("")); set(scrollsL, SCROLLS_IN.map(O).join(""));
    set(wale, D(WALE)); set(lowWale, D(LOW_WALE));
    // the bow: its rail, the white plate with the port and the cannon, the strap with its ring and rope
    set(bowRail, D(BOW_RAIL) + D(BOW_POST) + D(BOW_SCROLL)); set(bowRailL, BALUSTERS.map(O).join("") + O(BOW_SCROLL_IN));
    set(plate, D(PLATE)); set(port, D(PORT)); set(portL, O(PORT_RIM) + O(PLATE_LINE));
    set(barrel, D(BARREL)); set(muzzle, D(MUZZLE)); set(cannonL, D(BORE) + [160, 175, 195].map((px) => O([[px, at(BARREL.slice(0, 5), px) + 1], [px, 745]])).join(""));
    set(strap, D(STRAP)); set(strapL, [...ANCHOR, ...RIVETS].map(D).join("") + O(ROPE));
    // the figurehead: the banded neck, the ram's horn, the round head with its eye, nose and smile
    set(neck, D(NECK)); set(neckL, NECK_BANDS.map(O).join(""));
    set(horn, D(HORN)); set(hornL, O(HORN_CURL)); set(ear, D(EAR)); set(head, D(HEAD));
    set(face, D(FACE.eye) + D(FACE.pupil) + FACE.lines.map(O).join(""));
  }
  draw();

  const B = register(stage, (dt) => { const m = [stepS(go, dt), stepS(x, dt)].some(Boolean); if (!reducedMotion()) clock += dt * (0.25 + go.x); draw(); return m || go.x > 0.01; });
  bag.add(B.unregister);

  function point(q) {
    if (q) { x.t = clamp((q[0] - 200) * 0.1, -8, 8); go.t = 1; read.textContent = `under sail · ${Math.round(6 + 8 * fill)} knots`; }
    else { x.t = 0; go.t = 0; read.textContent = "rest"; }
    sail.classList.toggle("hi", !!q);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { fill = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "merry",
  means: "The Going Merry: bring the pointer near and her sails fill and she sails toward you on the swell; leave and she rides still.",
  rules: [1, 7, 8, 10],
  range: [0.5, 0.8, 1],
  mount,
});
