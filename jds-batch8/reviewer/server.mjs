// Private local reviewer server for the recruitment lead.
//
//   npm run reviewer          builds the reviewer app and serves it on http://127.0.0.1:5199
//
// - Listens on 127.0.0.1 only; rejects any other Host header (DNS-rebinding guard).
// - Serves the static reviewer app from reviewer/dist/ (never deployed).
// - Stores reviewer scores, notes and statuses in a local JSON file outside the
//   repository (default ~/JDS-B8-Reviewer/reviews.json). Answer files are read in
//   the browser tab and never sent to this server.
// - Every API call needs the per-run session value embedded in the served page,
//   so other websites open in the same browser cannot read or change reviews.

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { extname, join, normalize, relative, resolve, sep, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(here, "..");
const repoRoot = resolve(projectRoot, "..");
const distDir = join(here, "dist");
const port = Number(process.env.JDS_REVIEWER_PORT || 5199);
const dataDir = resolve(process.env.JDS_REVIEWER_DATA || join(homedir(), "JDS-B8-Reviewer"));
const dataFile = join(dataDir, "reviews.json");
const session = randomBytes(32).toString("hex");

const inside = (child, parent) => {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

if (inside(dataDir, repoRoot)) {
  console.error(`✗ Folder data review tidak boleh berada di dalam repository: ${dataDir}\n  Set JDS_REVIEWER_DATA ke folder lain.`);
  process.exit(1);
}
if (!existsSync(join(distDir, "reviewer.html"))) {
  console.error("✗ reviewer/dist belum ada. Jalankan: npm run reviewer");
  process.exit(1);
}

mkdirSync(dataDir, { recursive: true, mode: 0o700 });

function readReviews() {
  if (!existsSync(dataFile)) return {};
  try {
    const parsed = JSON.parse(readFileSync(dataFile, "utf8"));
    return parsed && typeof parsed === "object" && parsed.reviews && typeof parsed.reviews === "object" ? parsed.reviews : {};
  } catch {
    console.error(`⚠ ${dataFile} tidak dapat dibaca; membuat cadangan dan memulai kosong.`);
    renameSync(dataFile, `${dataFile}.corrupt-${Date.now()}`);
    return {};
  }
}

function writeReviews(reviews) {
  const temp = `${dataFile}.tmp`;
  writeFileSync(temp, JSON.stringify({ format: "JDS-B8-REVIEWS-v1", updatedAt: new Date().toISOString(), reviews }, null, 2), { mode: 0o600 });
  renameSync(temp, dataFile);
}

const SID = /^[0-9A-F]{6,16}$/;
const STATUSES = new Set(["Belum direview", "Sedang direview", "Interview", "Terpilih — Internal", "Terpilih — External", "Cadangan", "Tidak dilanjutkan"]);

function sanitizeReview(sid, body) {
  if (!body || typeof body !== "object") return null;
  const scores = {};
  for (const [k, v] of Object.entries(body.scores ?? {})) {
    if (!/^[a-zA-Z]{1,32}$/.test(k)) return null;
    if (v === null) scores[k] = null;
    else if (Number.isInteger(v) && v >= 0 && v <= 5) scores[k] = v;
    else return null;
  }
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 10_000) : "";
  const status = STATUSES.has(body.status) ? body.status : "Belum direview";
  return { submissionId: sid, scores, notes, status, updatedAt: new Date().toISOString() };
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "frame-ancestors 'none'",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("too large"));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);

const server = createServer(async (req, res) => {
  if (!allowedHosts.has(req.headers.host ?? "")) return send(res, 421, { error: "host not allowed" });
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

  if (url.pathname.startsWith("/api/")) {
    if (req.headers["x-reviewer-session"] !== session) return send(res, 403, { error: "forbidden" });
    if (req.method === "GET" && url.pathname === "/api/reviews") return send(res, 200, { reviews: readReviews(), dataFile });
    const match = url.pathname.match(/^\/api\/reviews\/([0-9A-F]{6,16})$/);
    if (req.method === "PUT" && match && SID.test(match[1])) {
      if (!String(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "json only" });
      try {
        const review = sanitizeReview(match[1], JSON.parse(await readBody(req)));
        if (!review) return send(res, 400, { error: "invalid review" });
        const reviews = readReviews();
        reviews[match[1]] = review;
        writeReviews(reviews);
        return send(res, 200, { review });
      } catch {
        return send(res, 400, { error: "invalid request" });
      }
    }
    return send(res, 404, { error: "not found" });
  }

  if (req.method !== "GET") return send(res, 405, { error: "method not allowed" });
  const path = url.pathname === "/" ? "/reviewer.html" : decodeURIComponent(url.pathname);
  const file = normalize(join(distDir, path));
  if (!file.startsWith(distDir + sep) || !existsSync(file)) return send(res, 404, "Not found", "text/plain; charset=utf-8");
  let body = readFileSync(file);
  if (file.endsWith("reviewer.html")) {
    body = body.toString("utf8").replace("</head>", `  <meta name="reviewer-session" content="${session}" />\n  </head>`);
  }
  return send(res, 200, body, TYPES[extname(file)] ?? "application/octet-stream");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`
JDS B8 Private Reviewer berjalan (hanya di komputer ini):

  http://127.0.0.1:${port}/

  Data review (skor, catatan, status): ${dataFile}
  File jawaban dibaca di browser dan tidak pernah dikirim ke server ini.
  Tekan Ctrl+C untuk berhenti.
`);
});
