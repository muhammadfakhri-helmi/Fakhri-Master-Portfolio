// Release gate for the public website build (dist/):
//   - exactly the assessment and the dashboard page, no source maps or inlined data: fonts,
//   - the assessment page does not load dashboard code,
//   - Content-Security-Policy that forbids network requests (connect-src 'none'),
//   - only relative asset URLs (works under any GitHub Pages sub-path),
//   - every referenced asset exists.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { projectRoot } from "./node-helpers.ts";

const dist = join(projectRoot, "dist");
const problems: string[] = [];
if (!existsSync(dist)) {
  console.error("✗ dist/ tidak ada — jalankan npm run build terlebih dahulu");
  process.exit(1);
}

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const files = walk(dist);

const forbidden: [string, RegExp][] = [["inlined data: font (blocked by CSP font-src 'self')", /url\(["']?data:font/]];

for (const file of files) {
  const rel = relative(dist, file);
  if (/\.map$/i.test(file)) problems.push(`${rel}: source map tidak boleh ada di build publik`);
  if (!/\.(html|js|css|json|svg|txt|md)$/i.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [name, re] of forbidden) if (re.test(text)) problems.push(`${rel}: ${name}`);
}

const pages = files.filter((f) => f.endsWith(".html")).map((f) => relative(dist, f)).sort();
if (pages.join(",") !== "index.html,reviewer.html") problems.push(`dist: halaman harus index.html dan reviewer.html (ditemukan ${pages.join(", ") || "tidak ada"})`);

// Script and stylesheet files each page loads directly (entry + preloaded shared chunks).
const assetsOf = (html: string) => [...html.matchAll(/\b(?:src|href)="\.\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]!);

for (const rel of pages) {
  const page = join(dist, rel);
  const html = readFileSync(page, "utf8");
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "").replaceAll("&#39;", "'");
  if (html.indexOf("Content-Security-Policy") > html.indexOf("<script")) problems.push(`${rel}: CSP harus berada sebelum tag script`);
  if (!csp.includes("connect-src 'none'")) problems.push(`${rel}: CSP connect-src 'none' tidak ditemukan`);
  if (!csp.includes("default-src 'self'")) problems.push(`${rel}: CSP default-src 'self' tidak ditemukan`);
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const ref = match[1]!;
    if (/^(?:[a-z]+:|#|data:)/i.test(ref)) continue;
    if (ref.startsWith("/")) problems.push(`${rel}: URL absolut "${ref}" rusak di sub-path GitHub Pages`);
    else if (!existsSync(resolve(dirname(page), ref))) problems.push(`${rel}: aset hilang "${ref}"`);
  }
}

// The assessment must not ship the dashboard code to candidates.
const DASHBOARD_MARKER = ["Dashboard Kelayakan", "Panitia"].join(" ");
if (pages.includes("index.html")) {
  for (const asset of assetsOf(readFileSync(join(dist, "index.html"), "utf8"))) {
    if (readFileSync(join(dist, asset), "utf8").includes(DASHBOARD_MARKER)) problems.push(`index.html memuat kode dashboard (${asset})`);
  }
}

if (problems.length) {
  console.error("✗ pemeriksaan build publik gagal:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ build publik aman (${files.length} file, CSP tanpa koneksi jaringan, path relatif)`);
