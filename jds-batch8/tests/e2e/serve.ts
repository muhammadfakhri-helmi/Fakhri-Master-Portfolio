// Web server for the Playwright tests:
//   1. creates a throw-away key pair (outside the repository),
//   2. builds the public site with that public key into <tmp>/site/<repo>/jds-batch8/,
//   3. builds the reviewer and starts reviewer/server.mjs,
//   4. serves the site under the GitHub Pages sub-path.

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { projectRoot } from "../../scripts/node-helpers.ts";
import { BASE_PATH, E2E_DIR, PASSPHRASE, paths, REVIEWER_PORT, SITE_PORT } from "./env.ts";

rmSync(E2E_DIR, { recursive: true, force: true });
mkdirSync(E2E_DIR, { recursive: true });
const run = (args: string[], env: Record<string, string> = {}) =>
  execFileSync(process.execPath, args, { cwd: projectRoot, stdio: "inherit", env: { ...process.env, ...env } });

const keygen = join(projectRoot, "scripts", "generate-keys.ts");
run([keygen, "--out", paths.keys, "--public-out", paths.publicKey, "--bits", "3072", "--force"], { JDS_KEY_PASSPHRASE: PASSPHRASE });
run([keygen, "--out", paths.otherKeys, "--public-out", paths.otherPublicKey, "--bits", "3072", "--force", "--plain"]);

const vite = join(projectRoot, "node_modules", "vite", "bin", "vite.js");
const siteDir = join(paths.site, ...BASE_PATH.split("/").filter(Boolean));
run([vite, "build", "--outDir", siteDir, "--emptyOutDir", "--logLevel", "warn"], { JDS_PUBLIC_KEY_FILE: paths.publicKey });
run([vite, "build", "--config", "vite.reviewer.config.ts", "--logLevel", "warn"]);

const reviewer = spawn(process.execPath, [join(projectRoot, "reviewer", "server.mjs")], {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env, JDS_REVIEWER_PORT: String(REVIEWER_PORT), JDS_REVIEWER_DATA: paths.reviewerData },
});
const stop = () => {
  reviewer.kill();
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  let file = normalize(join(paths.site, decodeURIComponent(url.pathname)));
  if (!file.startsWith(paths.site + sep)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("not found");
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}).listen(SITE_PORT, "127.0.0.1", () => console.log(`site on ${SITE_PORT}`));
