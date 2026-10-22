// Release gate for the public website build (dist/):
//   - no reviewer code, source maps or inlined data: fonts,
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

const forbidden: [string, RegExp][] = [
  ["reviewer code", new RegExp(["Private", "Reviewer"].join(" "))],
  ["inlined data: font (blocked by CSP font-src 'self')", /url\(["']?data:font/],
];

for (const file of files) {
  const rel = relative(dist, file);
  if (/\.map$/i.test(file) || /reviewer/i.test(rel)) problems.push(`${rel}: tidak boleh ada di build publik`);
  if (!/\.(html|js|css|json|svg|txt|md)$/i.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [name, re] of forbidden) if (re.test(text)) problems.push(`${rel}: ${name}`);
}

const pages = files.filter((f) => f.endsWith(".html"));
if (pages.length !== 1) problems.push(`dist: harus ada tepat satu halaman HTML (ditemukan ${pages.length})`);
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "").replaceAll("&#39;", "'");
  if (html.indexOf("Content-Security-Policy") > html.indexOf("<script")) problems.push("index.html: CSP harus berada sebelum tag script");
  if (!csp.includes("connect-src 'none'")) problems.push("index.html: CSP connect-src 'none' tidak ditemukan");
  if (!csp.includes("default-src 'self'")) problems.push("index.html: CSP default-src 'self' tidak ditemukan");
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const ref = match[1]!;
    if (/^(?:[a-z]+:|#|data:)/i.test(ref)) continue;
    if (ref.startsWith("/")) problems.push(`index.html: URL absolut "${ref}" rusak di sub-path GitHub Pages`);
    else if (!existsSync(resolve(dirname(page), ref))) problems.push(`index.html: aset hilang "${ref}"`);
  }
}

if (problems.length) {
  console.error("✗ pemeriksaan build publik gagal:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ build publik aman (${files.length} file, CSP tanpa koneksi jaringan, path relatif)`);
