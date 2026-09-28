// Captures poster images of Fakhri's public case-study websites for the
// evidence windows on this portfolio. Every view is taken from the live public
// site (already sanitized there); nothing internal is read. PNGs go to <outDir>
// and are converted to WebP by scripts/evidence/make_posters.py.
//
//   node scripts/evidence/capture.mjs <outDir> [shot-id ...]
//
// Needs Microsoft Edge or Google Chrome (set BROWSER=<path> to override).

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const SITES = {
  wims: "https://muhammadfakhri-helmi.github.io/Project-Coordinator-WIMS-Portofolio/",
  inpex: "https://muhammadfakhri-helmi.github.io/fakhri-experience/",
  alpha: "https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/",
  thesis: "https://muhammadfakhri-helmi.github.io/Fakhri-Tugas-Akhir-Design/",
  simprug: "https://muhammadfakhri-helmi.github.io/Simprug-Economic-Case-Study/",
};

// Each shot: which site, then either a section to scroll to or steps to run
// in the page. `reduced` renders with prefers-reduced-motion so scroll-reveal
// content is shown in its final state.
export const SHOTS = [
  { id: "wims-model", site: "wims", wait: 9000 },
  { id: "wims-dashboard", site: "wims", section: "dashboard", reduced: true },
  { id: "wims-attention", site: "wims", section: "attention", reduced: true },
  { id: "wims-archive", site: "wims", section: "archive", reduced: true },
  { id: "wims-planning", site: "wims", section: "planning", reduced: true },
  { id: "wims-equipment", site: "wims", section: "equipment", reduced: true, wait: 6000 },
  { id: "wims-pipeline", site: "wims", section: "wims", reduced: true },

  { id: "inpex-overview", site: "inpex", wait: 10000 },
  { id: "inpex-stackup", site: "inpex", chapter: 1 },
  { id: "inpex-load", site: "inpex", chapter: 2 },
  { id: "inpex-offset", site: "inpex", chapter: 4 },
  { id: "inpex-fatigue", site: "inpex", chapter: 5 },
  { id: "inpex-viv", site: "inpex", chapter: 6 },
  { id: "inpex-summary", site: "inpex", chapter: 10 },

  { id: "alpha-rig", site: "alpha", wait: 9000, js: "document.querySelector('#play[aria-label=Jeda]')?.click()" },
  { id: "alpha-bit", site: "alpha", view: "bit", segment: 6 },
  { id: "alpha-well", site: "alpha", view: "well", segment: 9 },
  { id: "alpha-complete", site: "alpha", view: "well", segment: 11 },

  { id: "thesis-top", site: "thesis", wait: 6000, reduced: true },
  { id: "thesis-path", site: "thesis", section: "path", reduced: true },
  { id: "thesis-forces", site: "thesis", section: "forces", reduced: true },
  { id: "thesis-designs", site: "thesis", section: "designs", reduced: true },

  { id: "simprug-top", site: "simprug", wait: 7000, reduced: true },
  { id: "simprug-fiscal", site: "simprug", section: "fiscal", reduced: true },
  { id: "simprug-performance", site: "simprug", section: "performance", reduced: true },
];

const W = 1280;
const H = 800;
const DPR = 1.5;

const [outDir, ...only] = process.argv.slice(2);
if (!outDir) {
  console.error("usage: node scripts/evidence/capture.mjs <outDir> [shot-id ...]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

function browserPath() {
  const roots = [process.env["ProgramFiles(x86)"], process.env.ProgramFiles].filter(Boolean);
  const candidates = [
    process.env.BROWSER,
    ...roots.map((r) => join(r, "Microsoft", "Edge", "Application", "msedge.exe")),
    ...roots.map((r) => join(r, "Google", "Chrome", "Application", "chrome.exe")),
  ].filter(Boolean);
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error("No Edge/Chrome found; set BROWSER=<path>");
  return hit;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9400 + Math.floor(Math.random() * 400);
const browser = spawn(browserPath(), [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
  "--mute-audio",
  `--window-size=${W},${H}`,
  `--user-data-dir=${join(outDir, `.profile-${port}`)}`,
  "about:blank",
]);

let targets = [];
for (let i = 0; i < 60 && !targets.some((t) => t.type === "page"); i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  } catch {
    /* browser still starting */
  }
  await sleep(250);
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));

let seq = 0;
const pending = new Map();
const waiters = [];
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method) waiters.filter((w) => w.method === msg.method).forEach((w) => w.resolve());
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const once = (method, timeout = 30000) =>
  new Promise((resolve) => {
    const w = { method, resolve };
    waiters.push(w);
    setTimeout(resolve, timeout);
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) console.warn("  js error:", r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
  return r.result?.result?.value;
};
const clickAt = async (selector) => {
  const box = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!box) return console.warn(`  no element for ${selector}`);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 });
  }
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });

let loaded = { site: null, reduced: null };
for (const shot of SHOTS.filter((s) => only.length === 0 || only.includes(s.id))) {
  const reduced = Boolean(shot.reduced);
  if (loaded.site !== shot.site || loaded.reduced !== reduced) {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
    const done = once("Page.loadEventFired");
    await send("Page.navigate", { url: SITES[shot.site] });
    await done;
    loaded = { site: shot.site, reduced };
  }
  if (shot.section) {
    await evaluate(`document.getElementById(${JSON.stringify(shot.section)})?.scrollIntoView({ block: "start", behavior: "instant" })`);
  }
  if (shot.chapter !== undefined) await evaluate(`document.querySelectorAll("#chapters button.ch")[${shot.chapter}]?.click()`);
  if (shot.view) await evaluate(`document.querySelector('#views [data-v="${shot.view}"]')?.click()`);
  if (shot.segment !== undefined) await clickAt(`#bar .seg:nth-child(${shot.segment + 1})`);
  if (shot.js) await evaluate(shot.js);
  await sleep(shot.wait ?? 3500);
  const shotResult = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(join(outDir, `${shot.id}.png`), Buffer.from(shotResult.result.data, "base64"));
  console.log(`✓ ${shot.id}`);
}

ws.close();
browser.kill();
process.exit(0);
