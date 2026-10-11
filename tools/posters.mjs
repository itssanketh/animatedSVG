// Rebuilds the gallery stills: every figure at rest, light and dark, at the size of a gallery card, as WebP.
// Run from the project folder with a static server on :8765 (python3 -m http.server 8765) and playwright-core installed:
//   node tools/posters.mjs            all figures in index.html
//   node tools/posters.mjs gpu cat    just these
// Needs Python with Pillow for the WebP step.
import { createRequire } from "module";
import fs from "fs";
import { execFileSync } from "child_process";
const require = createRequire(process.env.HOME + "/.cache/hairline-look/package.json");
const { chromium } = require("playwright-core");
let names = process.argv.slice(2);
if (!names.length) { const b = fs.readFileSync("index.html", "utf8").match(/const CATEGORIES = \[([\s\S]*?)\];/)[1]; names = [...b.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]).concat(["ghost", "envelope", "rocket"]); }
fs.mkdirSync("posters", { recursive: true });
let br; try { br = await chromium.launch({ channel: "chrome" }); } catch { br = await chromium.launch(); }
const p = await (await br.newContext({ viewport: { width: 366, height: 520 }, deviceScaleFactor: 2, reducedMotion: "reduce" })).newPage();
for (const n of names) for (const t of ["light", "dark"]) {
  await p.goto(`http://localhost:8765/hairline-${n}.html?theme=${t}`);
  await p.waitForTimeout(250);
  await p.screenshot({ path: `posters/${n}-${t}.png` });
}
await br.close();
execFileSync("python3", ["-c", "import glob,os\nfrom PIL import Image\nfor f in glob.glob('posters/*.png'):\n    Image.open(f).save(f[:-4]+'.webp','WEBP',quality=72,method=6); os.remove(f)"]);
console.log(`${names.length * 2} stills written to posters/`);
