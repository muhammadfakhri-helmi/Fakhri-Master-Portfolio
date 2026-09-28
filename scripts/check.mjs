// Privacy and release check for a public repository.
//
//   npm run check        scans the source tree (everything Git would publish)
//   npm run check:dist   scans the production build in dist/ and verifies that
//                        every file referenced by the page exists
//
// Fails on raw documents, local absolute paths, e-mail addresses, phone numbers,
// secrets, internal document links, source maps, and any term listed in the
// git-ignored `.privacy-terms.local.txt` (one term per line; `#` comments).
// Patterns are assembled from parts so this file never matches itself.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distMode = process.argv.includes("--dist");
const scanRoot = distMode ? join(root, "dist") : root;

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".claude", ".vscode"]);
const SELF = relative(root, fileURLToPath(import.meta.url));
const TEXT_EXT = new Set([".html", ".css", ".js", ".mjs", ".ts", ".json", ".md", ".svg", ".txt", ".py", ".yml", ".yaml", ".xml", ".webmanifest"]);
const RAW_DOC_EXT = new Set([".pdf", ".xlsx", ".xls", ".xlsm", ".csv", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".db", ".sqlite", ".map"]);

const j = (...parts) => parts.join("");
const RULES = [
  { name: "Windows absolute path", re: new RegExp(j("\\b[A-Za-z]:", "[\\\\/]", "(?:Users|Download|fakhri|Program|Antigravity)"), "i") },
  { name: "file URL", re: new RegExp(j("file", ":///"), "i") },
  { name: "home directory path", re: new RegExp(j("/(?:Users|home)", "/[A-Za-z0-9_.-]+/")) },
  { name: "e-mail address", re: new RegExp(j("[A-Za-z0-9._%+-]+", "@", "[A-Za-z0-9-]+\\.[A-Za-z0-9.-]*[A-Za-z]{2,}")) },
  { name: "Indonesian phone number", re: new RegExp(j("(?:\\+62|\\b08)", "[\\s-]?\\d{2,4}[\\s-]?\\d{3,4}[\\s-]?\\d{3,4}")) },
  { name: "private key", re: new RegExp(j("-----BEGIN ", "[A-Z ]*PRIVATE KEY")) },
  { name: "access token", re: new RegExp(j("\\b(?:gh[pousr]_", "[A-Za-z0-9]{20,}|github_pat_", "[A-Za-z0-9_]{20,}|AKIA", "[0-9A-Z]{16}|sk-", "[A-Za-z0-9]{20,})")) },
  { name: "credential assignment", re: new RegExp(j("\\b(?:pass", "word|api[_-]?key|secret|token)\\s*[:=]\\s*['\"][^'\"]{6,}"), "i") },
  { name: "internal document link", re: new RegExp(j("(?:share", "point\\.com|one", "drive\\.live|1drv\\.ms|docs\\.google\\.com|drive\\.google\\.com)"), "i") },
];
if (distMode) RULES.push({ name: "localhost reference", re: new RegExp(j("local", "host|127\\.0\\.0\\.1")) });

// Allow-list: font licence URLs inside third-party CSS comments are fine.
const ALLOW = [new RegExp(j("scripts\\.sil\\.org"))];

// Contact details Fakhri approved for publication on 28 Sep 2026. Only these
// exact values are allowed; any other e-mail address or phone number still fails.
const APPROVED_PUBLIC = [j("muhammadfakhrihelmi", "@", "gmail.com"), j("+62 852-", "6150-5740"), j("62852", "61505740")];
const withoutApproved = (line) => APPROVED_PUBLIC.reduce((text, value) => text.split(value).join(""), line);

// The one document this site may publish: Fakhri's CV, prepared by
// scripts/make_public_cv.py and pinned by its SHA-256 in docs/public-cv.json.
// Any other PDF — or this one with different bytes — still fails.
const PUBLIC_CV = (() => {
  const record = join(root, "docs", "public-cv.json");
  if (!existsSync(record)) return null;
  const { path, sha256 } = JSON.parse(readFileSync(record, "utf8"));
  return { path, sha256 };
})();
const isApprovedCv = (file, rel) => {
  if (!PUBLIC_CV) return false;
  if (rel !== `${distMode ? "dist" : "public"}/${PUBLIC_CV.path}`) return false;
  return createHash("sha256").update(readFileSync(file)).digest("hex") === PUBLIC_CV.sha256;
};

function loadTerms() {
  const file = join(root, ".privacy-terms.local.txt");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Plain words match whole words only, so short names do not hit ordinary words.
      const bounded = /^[A-Za-z0-9 ]+$/.test(term) ? `\\b${escaped}\\b` : escaped;
      return { name: "private term", re: new RegExp(bounded, "i"), term };
    });
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry === ".privacy-terms.local.txt") continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

if (!existsSync(scanRoot)) {
  console.error(`✗ ${relative(root, scanRoot) || "."} does not exist${distMode ? " — run `npm run build` first" : ""}`);
  process.exit(1);
}

const terms = loadTerms();
const problems = [];
const files = walk(scanRoot);

for (const file of files) {
  const rel = relative(root, file).split(sep).join("/");
  const ext = extname(file).toLowerCase();
  if (RAW_DOC_EXT.has(ext) && !isApprovedCv(file, rel)) problems.push(`${rel}: raw document / source map must not be published`);
  if (!distMode && rel.startsWith("public/character/") && ext === ".png") problems.push(`${rel}: original PNG frames stay in the source asset folder`);
  if (!TEXT_EXT.has(ext) || rel === SELF.split(sep).join("/")) continue;

  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, index) => {
    if (ALLOW.some((allow) => allow.test(raw))) return;
    const line = withoutApproved(raw);
    for (const rule of [...RULES, ...terms]) {
      if (rule.re.test(line)) {
        const shown = rule.term ? "(term from local list)" : line.trim().slice(0, 120);
        problems.push(`${rel}:${index + 1}: ${rule.name} — ${shown}`);
      }
    }
  });
}

// Built pages (English and Indonesian): every local src/srcset/href/content
// URL must exist in dist/, resolved from the page's own folder.
if (distMode) {
  const pages = files.filter((f) => f.endsWith(".html"));
  if (pages.length < 2) problems.push(`dist: expected the English and Indonesian pages, found ${pages.length}`);
  for (const page of pages) {
    const pageRel = relative(root, page).split(sep).join("/");
    const html = readFileSync(page, "utf8");
    const refs = new Set();
    for (const match of html.matchAll(/\b(?:src|href|content)="([^"]+)"/g)) refs.add(match[1]);
    for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
      for (const candidate of match[1].split(",")) refs.add(candidate.trim().split(/\s+/)[0]);
    }
    for (const ref of refs) {
      if (!ref || /^(?:[a-z]+:|#|\/\/|data:)/i.test(ref) || !/[./]/.test(ref) || ref.includes(" ")) continue;
      if (ref.startsWith("/")) {
        problems.push(`${pageRel}: root-absolute URL "${ref}" breaks on a GitHub Pages sub-path`);
        continue;
      }
      const target = resolve(dirname(page), ref.split("#")[0].split("?")[0]);
      if (!target.startsWith(scanRoot) || !existsSync(target)) problems.push(`${pageRel}: missing asset "${ref}"`);
    }
  }
  // Frames requested at runtime by the character sequences, at every derivative width.
  const js = files.filter((f) => f.endsWith(".js")).map((f) => readFileSync(f, "utf8")).join("\n");
  const frameIds = new Set([...js.matchAll(/["'`](frame-\d{2}-[a-z-]+)["'`]/g)].map((m) => m[1]));
  if (frameIds.size === 0) problems.push("dist: no character frame ids found in the built script");
  for (const id of frameIds) {
    for (const width of [560, 840, 1122]) {
      if (!existsSync(join(scanRoot, "character", `${id}-${width}.webp`))) problems.push(`dist: missing frame character/${id}-${width}.webp`);
    }
  }
}

const label = distMode ? "dist/" : "source tree";
if (problems.length) {
  console.error(`✗ privacy/release check failed for ${label}:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`✓ privacy/release check passed for ${label} (${files.length} files, ${terms.length} private terms)`);
