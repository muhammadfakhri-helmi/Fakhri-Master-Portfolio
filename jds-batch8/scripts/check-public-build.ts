// Release gate for the public website build (dist/):
//   - no private key material, protected-key files or reviewer code,
//   - Content-Security-Policy that forbids network requests (connect-src 'none'),
//   - only relative asset URLs (works under any GitHub Pages sub-path),
//   - every referenced asset exists.
// Also warns when the recipient public key is not configured yet.

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
  ["PEM private key", new RegExp(["-----BEGIN", "[A-Z ]*", "PRIVATE KEY"].join(" ?"))],
  ["protected private key file", new RegExp(["JDS-B8-PRIVATE", "KEY-v1"].join("-"))],
  ["reviewer code", new RegExp(["Private", "Reviewer"].join(" "))],
  ["JWK private exponent", /"d"\s*:\s*"[A-Za-z0-9_-]{100,}"/],
  ["inlined data: font (blocked by CSP font-src 'self')", /url\(["']?data:font/],
];

for (const file of files) {
  const rel = relative(dist, file);
  if (/\.(map|pem|key)$/i.test(file) || /reviewer/i.test(rel)) problems.push(`${rel}: tidak boleh ada di build publik`);
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

const key = JSON.parse(readFileSync(join(projectRoot, "src", "config", "recipient-public-key.json"), "utf8")) as { configured?: boolean };
if (!key.configured) {
  const message = "Kunci publik belum dikonfigurasi: website tampil, tetapi unduhan asesmen dinonaktifkan. Jalankan npm run keys:generate (lihat DEPLOYMENT.md).";
  console.warn(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `⚠ ${message}`);
}

if (problems.length) {
  console.error("✗ pemeriksaan build publik gagal:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ build publik aman (${files.length} file, CSP tanpa koneksi jaringan, path relatif)`);
