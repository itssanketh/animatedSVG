// node render.mjs [stills t1 t2 ...]  — renders frames/ at 30fps, or named stills
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(process.env.HOME + "/.cache/hairline-look/package.json");
const { chromium } = require("playwright-core");
const FPS = 30, DUR = 20;
const args = process.argv.slice(2), stills = args[0] === "stills" ? args.slice(1).map(Number) : null;
const br = await chromium.launch({ channel: "chrome" });
const ctx = await br.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: "light" });
const p = await ctx.newPage();
await p.clock.install({ time: 0 });
await p.goto("http://localhost:8765/brag-output/work/stage.html");
await p.clock.runFor(500);
await p.evaluate(() => window.ready());
const out = stills ? "stills" : "frames";
fs.mkdirSync(out, { recursive: true });
const want = stills ? new Set(stills.map((s) => Math.round(s * FPS))) : null;
const last = stills ? Math.max(...want) : DUR * FPS - 1;
for (let f = 0; f <= last; f++) {
  const t = f / FPS;
  const [x, y] = await p.evaluate((t) => { window.seek(t); return window.cursorAt(t); }, t);
  await p.mouse.move(Math.min(1919, Math.max(0, x)), Math.min(1079, Math.max(0, y)));
  await p.clock.runFor(1000 / FPS);
  if (!want || want.has(f)) await p.screenshot({ path: `${out}/${String(f).padStart(4, "0")}.${stills ? "png" : "jpg"}`, ...(stills ? {} : { type: "jpeg", quality: 92 }) });
}
await br.close();
